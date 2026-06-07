import os
import asyncio
import logging
from contextlib import asynccontextmanager
from pycrdt import Doc, Map, Text
from pycrdt.websocket import WebsocketServer, ASGIServer
import redis.asyncio as aioredis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drawdoc-ws")

REDIS_URL = os.getenv("WS_REDIS_URL", "redis://localhost:6379")
SNAPSHOT_INTERVAL = int(os.getenv("WS_SNAPSHOT_INTERVAL", "30"))
HOST = os.getenv("WS_HOST", "0.0.0.0")
PORT = int(os.getenv("WS_PORT") or os.getenv("PORT") or "1234")


@asynccontextmanager
async def redis_provider(doc: Doc, redis: aioredis.Redis, path: str):
    redis_key = f"yjs:{path}"

    data = await redis.get(redis_key)
    if data:
        doc.apply_update(bytes(data))
        logger.info("Loaded snapshot for %s", path)
    else:
        doc["content"] = Map()
        doc["content"]["blocknote"] = Text()
        doc["content"]["excalidraw"] = Map()
        logger.info("Created new doc for %s", path)

    async def _periodic_save():
        while True:
            await asyncio.sleep(SNAPSHOT_INTERVAL)
            update = doc.get_update()
            await redis.set(redis_key, bytes(update))
            logger.debug("Saved snapshot for %s (%d bytes)", path, len(update))

    save_task = asyncio.create_task(_periodic_save())

    try:
        yield
    finally:
        save_task.cancel()
        try:
            await save_task
        except asyncio.CancelledError:
            pass
        update = doc.get_update()
        await redis.set(redis_key, bytes(update))
        logger.info("Saved final snapshot for %s (%d bytes)", path, len(update))


async def main():
    redis = aioredis.from_url(REDIS_URL, decode_responses=False)
    await redis.ping()
    logger.info("Connected to Redis at %s", REDIS_URL)

    def provider_factory(doc=None, log=None, path=None):
        return redis_provider(doc, redis, path)

    ws_server = WebsocketServer(
        rooms_ready=True,
        auto_clean_rooms=True,
        provider_factory=provider_factory,
    )

    async with ws_server:
        asgi_app = ASGIServer(ws_server)
        import uvicorn
        config = uvicorn.Config(asgi_app, host=HOST, port=PORT, log_level="info")
        server = uvicorn.Server(config)
        logger.info("WS server starting on %s:%s", HOST, PORT)
        await server.serve()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
