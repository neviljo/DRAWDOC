import os
import asyncio
import logging
import uuid
from contextlib import asynccontextmanager, suppress
from pycrdt import Doc, Map
from pycrdt.websocket import WebsocketServer, ASGIServer
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

        class _SafeASGI:
            def __init__(self, app):
                self.app = app
            async def __call__(self, scope, receive, send):
                async def _send(event):
                    try:
                        await send(event)
                    except Exception:
                        pass
                await self.app(scope, receive, _send)

        import uvicorn
        config = uvicorn.Config(_SafeASGI(asgi_app), host=HOST, port=PORT, log_level="info")
        server = uvicorn.Server(config)
        logger.info("WS server starting on %s:%s", HOST, PORT)
        await server.serve()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
