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


async def save_to_pg(pg, doc_id: str, update_bytes: bytes):
    if not pg:
        return
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
    with suppress(Exception):
        row = await pg.fetchrow(
            "SELECT yjs_state FROM doc_snapshots WHERE doc_id = $1 ORDER BY saved_at DESC LIMIT 1",
            uuid.UUID(doc_id),
        )
        if row and row["yjs_state"]:
            return bytes(row["yjs_state"])
    return None


async def _periodic_save_running(doc: Doc, redis: aioredis.Redis, pg: asyncpg.Pool | None, path: str, redis_key: str):
    while True:
        await asyncio.sleep(SNAPSHOT_INTERVAL)
        update = doc.get_update()
        ub = bytes(update)
        await redis.set(redis_key, ub)
        await save_to_pg(pg, path, ub)


@asynccontextmanager
async def doc_provider(doc: Doc, redis: aioredis.Redis, pg: asyncpg.Pool | None, path: str):
    redis_key = f"yjs:{path}"

    data = await redis.get(redis_key)
    if data:
        doc.apply_update(bytes(data))
        logger.info("Loaded snapshot from Redis for %s", path)
    else:
        pg_data = await load_from_pg(pg, path) if pg else None
        if pg_data:
            doc.apply_update(pg_data)
            logger.info("Loaded snapshot from PostgreSQL for %s", path)
        else:
            doc["excalidraw"] = Map()
            logger.info("Created new doc for %s", path)

    if path not in _save_tasks or _save_tasks[path].done():
        _save_tasks[path] = asyncio.create_task(_periodic_save_running(doc, redis, pg, path, redis_key))
    _save_refcount[path] = _save_refcount.get(path, 0) + 1

    try:
        yield
    finally:
        _save_refcount[path] -= 1
        if _save_refcount[path] <= 0:
            if path in _save_tasks:
                _save_tasks[path].cancel()
                with suppress(asyncio.CancelledError):
                    await _save_tasks[path]
                del _save_tasks[path]
                del _save_refcount[path]
        update = doc.get_update()
        ub = bytes(update)
        await redis.set(redis_key, ub)
        await save_to_pg(pg, path, ub)
        logger.info("Saved final snapshot for %s (%d bytes)", path, len(ub))


async def main():
    redis = aioredis.from_url(REDIS_URL, decode_responses=False)
    await redis.ping()
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
            ws_ping_interval=20,
            ws_ping_timeout=10,
        )
        server = uvicorn.Server(config)
        logger.info("WS server starting on %s:%s", HOST, PORT)
        await server.serve()


class _SafeASGI:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
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
                        # Explicitly broadcast SYNC_STEP2 / SYNC_UPDATE to all other clients.
                        # Safety net: if YDoc observer → _broadcast_updates fails,
                        # other clients still receive updates in real time.
                        sync_subtype = message[1] if len(message) > 1 else None
                        if sync_subtype in (
                            YSyncMessageType.SYNC_STEP2,
                            YSyncMessageType.SYNC_UPDATE,
                        ):
                            for client in self.clients:
                                if client is not channel:
                                    tg.start_soon(client.send, message)
                    elif message_type == YMessageType.AWARENESS:
                        disconnection = is_awareness_disconnect_message(message[1:])
                        for client in self.clients:
                            if disconnection and client is channel:
                                continue
                            tg.start_soon(client.send, message)
                        self.awareness.apply_awareness_update(
                            read_message(message[1:]), self
                        )
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


ASGIWebsocket.send = _safe_ws_send
YRoom.serve = _patched_serve


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
