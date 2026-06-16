import os
import asyncio
import logging
import uuid
from contextlib import asynccontextmanager, suppress
from pycrdt import (
    Doc, Map, YMessageType, YSyncMessageType,
    create_sync_message, handle_sync_message,
    is_awareness_disconnect_message, read_message,
)
from pycrdt.websocket import WebsocketServer, ASGIServer
from pycrdt.websocket.asgi_server import ASGIWebsocket
from pycrdt.websocket.yroom import YRoom
from anyio import create_task_group
import redis.asyncio as aioredis
import asyncpg

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drawdoc-ws")

REDIS_URL = os.getenv("WS_REDIS_URL", "redis://localhost:6379")
DATABASE_URL = os.getenv("WS_DATABASE_URL") or os.getenv("DATABASE_URL", "")
SNAPSHOT_INTERVAL = int(os.getenv("WS_SNAPSHOT_INTERVAL", "30"))
HOST = os.getenv("WS_HOST", "0.0.0.0")
PORT = int(os.getenv("WS_PORT") or os.getenv("PORT") or "1234")

_save_tasks: dict[str, asyncio.Task] = {}
_save_refcount: dict[str, int] = {}
_REDIS_CLIENT: aioredis.Redis | None = None
INSTANCE_ID = uuid.uuid4().bytes


async def save_to_pg(pg, doc_id: str, update_bytes: bytes):
    if not pg:
        return
    doc_id = doc_id.lstrip("/")
    with suppress(Exception):
        await pg.execute(
            """INSERT INTO doc_snapshots (id, doc_id, yjs_state, version, saved_at)
               VALUES ($1, $2, $3, 1, NOW())
               ON CONFLICT (doc_id) DO UPDATE
               SET yjs_state = $3, version = doc_snapshots.version + 1, saved_at = NOW()""",
            uuid.uuid4(), uuid.UUID(doc_id), update_bytes,
        )


async def load_from_pg(pg, doc_id: str) -> bytes | None:
    if not pg:
        return None
    doc_id = doc_id.lstrip("/")
    with suppress(Exception):
        row = await pg.fetchrow(
            "SELECT yjs_state FROM doc_snapshots WHERE doc_id = $1 ORDER BY saved_at DESC LIMIT 1",
            uuid.UUID(doc_id),
        )
        if row and row["yjs_state"]:
            return bytes(row["yjs_state"])
    return None


async def _periodic_save_running(doc: Doc, redis: aioredis.Redis, pg: asyncpg.Pool | None, doc_id: str, redis_key: str):
    while True:
        await asyncio.sleep(SNAPSHOT_INTERVAL)
        update = doc.get_update()
        ub = bytes(update)
        await redis.set(redis_key, ub)
        await save_to_pg(pg, doc_id, ub)


async def redis_pubsub_listener(doc: Doc, redis: aioredis.Redis, doc_id: str):
    pubsub_key = f"yjs:pubsub:{doc_id}"
    while True:
        try:
            pubsub = redis.pubsub()
            await pubsub.subscribe(pubsub_key)
            logger.info("Subscribed to Redis Pub/Sub channel %s", pubsub_key)
            try:
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        data = message["data"]
                        if len(data) > 16:
                            sender_instance_id = data[:16]
                            raw_msg = data[16:]
                            
                            if sender_instance_id == INSTANCE_ID:
                                continue
                            
                            if len(raw_msg) > 1:
                                msg_type = raw_msg[0]
                                if msg_type == YMessageType.SYNC:
                                    room = getattr(doc, "_room", None)
                                    if room:
                                        with suppress(Exception):
                                            handle_sync_message(raw_msg[1:], doc)
                                            for client in room.clients:
                                                room._task_group.start_soon(client.send, raw_msg)
                                elif msg_type == YMessageType.AWARENESS:
                                    room = getattr(doc, "_room", None)
                                    if room:
                                        with suppress(Exception):
                                            room.awareness.apply_awareness_update(
                                                read_message(raw_msg[1:]), room
                                            )
                                            for client in room.clients:
                                                room._task_group.start_soon(client.send, raw_msg)
            finally:
                with suppress(Exception):
                    await pubsub.unsubscribe(pubsub_key)
        except asyncio.CancelledError:
            logger.info("Redis Pub/Sub listener cancelled for %s", doc_id)
            break
        except Exception as e:
            logger.warning("Redis Pub/Sub listener error, reconnecting in 2s: %s", e)
            await asyncio.sleep(0.5)


@asynccontextmanager
async def doc_provider(doc: Doc, redis: aioredis.Redis, pg: asyncpg.Pool | None, path: str):
    doc_id = path.lstrip("/")
    redis_key = f"yjs:{doc_id}"

    data = await redis.get(redis_key)
    if data:
        doc.apply_update(bytes(data))
        logger.info("Loaded snapshot from Redis for %s", doc_id)
    else:
        pg_data = await load_from_pg(pg, doc_id) if pg else None
        if pg_data:
            doc.apply_update(pg_data)
            logger.info("Loaded snapshot from PostgreSQL for %s", doc_id)
        else:
            doc["excalidraw"] = Map()
            logger.info("Created new doc for %s", doc_id)

    # Start the pubsub listener task for horizontal scaling sync
    pubsub_task = asyncio.create_task(redis_pubsub_listener(doc, redis, doc_id))

    if doc_id not in _save_tasks or _save_tasks[doc_id].done():
        _save_tasks[doc_id] = asyncio.create_task(_periodic_save_running(doc, redis, pg, doc_id, redis_key))
    _save_refcount[doc_id] = _save_refcount.get(doc_id, 0) + 1

    try:
        yield
    finally:
        # Stop the pubsub listener task
        pubsub_task.cancel()
        with suppress(asyncio.CancelledError):
            await pubsub_task

        _save_refcount[doc_id] -= 1
        if _save_refcount[doc_id] <= 0:
            if doc_id in _save_tasks:
                _save_tasks[doc_id].cancel()
                with suppress(asyncio.CancelledError):
                    await _save_tasks[doc_id]
                del _save_tasks[doc_id]
                del _save_refcount[doc_id]
        update = doc.get_update()
        ub = bytes(update)
        await redis.set(redis_key, ub)
        await save_to_pg(pg, doc_id, ub)
        logger.info("Saved final snapshot for %s (%d bytes)", doc_id, len(ub))


async def main():
    global _REDIS_CLIENT
    redis = aioredis.from_url(REDIS_URL, decode_responses=False)
    await redis.ping()
    _REDIS_CLIENT = redis
    logger.info("Connected to Redis at %s", REDIS_URL)

    pg = None
    if DATABASE_URL:
        pg_url = DATABASE_URL.replace("+asyncpg", "").replace("+psycopg", "")
        try:
            pg = await asyncpg.create_pool(pg_url, min_size=1, max_size=3)
            logger.info("Connected to PostgreSQL at %s", pg_url)
        except Exception as e:
            logger.warning("PostgreSQL unavailable, using Redis only: %s", e)

    def provider_factory(doc=None, log=None, path=None):
        return doc_provider(doc, redis, pg, path)

    ws_server = WebsocketServer(
        rooms_ready=True,
        auto_clean_rooms=True,
        provider_factory=provider_factory,
    )

    async with ws_server:
        asgi_app = ASGIServer(ws_server)

        import uvicorn
        config = uvicorn.Config(
            _SafeASGI(asgi_app),
            host=HOST,
            port=PORT,
            log_level="info",
            ws_ping_interval=5,
            ws_ping_timeout=3,
        )
        server = uvicorn.Server(config)
        logger.info("WS server starting on %s:%s", HOST, PORT)
        await server.serve()


class _SafeASGI:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    (b"content-type", b"text/plain"),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": b"OK",
            })
            return

        async def _send(event):
            try:
                await send(event)
            except Exception as e:
                logger.warning("ASGI send failed: %s", e)
        await self.app(scope, receive, _send)


_ORIG_WS_SEND = ASGIWebsocket.send


async def _safe_ws_send(self, message):
    try:
        await _ORIG_WS_SEND(self, message)
    except Exception:
        pass


async def _patched_serve(self, channel):
    """Serve a client with safe error handling.
    Broadcasting is handled by the room's _broadcast_updates task via ydoc.observe."""
    try:
        async with create_task_group() as tg:
            self.clients.add(channel)
            sync_message = create_sync_message(self.ydoc)
            await channel.send(sync_message)
            async for message in channel:
                if not message:
                    continue
                try:
                    skip = False
                    if self.on_message:
                        _skip = self.on_message(message)
                        skip = await _skip if hasattr(_skip, '__await__') else _skip
                    if skip:
                        continue
                    message_type = message[0]
                    if message_type == YMessageType.SYNC:
                        reply = handle_sync_message(message[1:], self.ydoc)
                        if reply is not None:
                            tg.start_soon(channel.send, reply)
                        # Direct-broadcast SYNC_UPDATE to other local clients for low latency
                        # (bypasses the _broadcast_updates memory stream).
                        # Full-state SYNC_STEP2 is not broadcast here to avoid re-triggering
                        # state exchanges; it propagates through _broadcast_updates.
                        sync_subtype = message[1] if len(message) > 1 else None
                        if sync_subtype == YSyncMessageType.SYNC_UPDATE:
                            for client in self.clients:
                                if client is not channel:
                                    tg.start_soon(client.send, message)
                        if sync_subtype in (
                            YSyncMessageType.SYNC_STEP2,
                            YSyncMessageType.SYNC_UPDATE,
                        ):
                            if _REDIS_CLIENT:
                                doc_id = channel.path.lstrip("/")
                                pubsub_key = f"yjs:pubsub:{doc_id}"
                                pub_data = INSTANCE_ID + message
                                tg.start_soon(_REDIS_CLIENT.publish, pubsub_key, pub_data)
                    elif message_type == YMessageType.AWARENESS:
                        disconnection = is_awareness_disconnect_message(message[1:])
                        for client in self.clients:
                            if disconnection and client is channel:
                                continue
                            tg.start_soon(client.send, message)
                        self.awareness.apply_awareness_update(
                            read_message(message[1:]), self
                        )
                        # Sync awareness across other server instances using Redis Pub/Sub
                        if _REDIS_CLIENT:
                            doc_id = channel.path.lstrip("/")
                            pubsub_key = f"yjs:pubsub:{doc_id}"
                            pub_data = INSTANCE_ID + message
                            tg.start_soon(_REDIS_CLIENT.publish, pubsub_key, pub_data)
                except Exception as exc:
                    logger.warning("message handler error: %s", exc, exc_info=True)
                    if self._on_message_error is not None:
                        _handled = self._on_message_error(exc, message, channel)
                        handled = await _handled if hasattr(_handled, '__await__') else _handled
                        if handled:
                            continue
    except Exception:
        logger.warning("serve error", exc_info=True)
    finally:
        self.clients.discard(channel)


_ORIG_RUN_PROVIDER = YRoom._run_provider


async def _patched_run_provider(self):
    self.ydoc._room = self
    await _ORIG_RUN_PROVIDER(self)


ASGIWebsocket.send = _safe_ws_send
YRoom.serve = _patched_serve
YRoom._run_provider = _patched_run_provider


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
