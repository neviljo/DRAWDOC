import os
import logging
from pycrdt import Doc, Map, Text
from pycrdt.websocket import WebsocketServer, ASGIServer, YRoom
import redis.asyncio as aioredis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drawdoc-ws")

REDIS_URL = os.getenv("WS_REDIS_URL", "redis://localhost:6379")
SNAPSHOT_INTERVAL = int(os.getenv("WS_SNAPSHOT_INTERVAL", "30"))
HOST = os.getenv("WS_HOST", "0.0.0.0")
PORT = int(os.getenv("WS_PORT", "1234"))


class DrawDocRoom(YRoom):
    def __init__(self, room_name: str, redis: aioredis.Redis):
        super().__init__(ready=True)
        self.room_name = room_name
        self.redis = redis

    async def _load_snapshot(self):
        data = await self.redis.get(f"yjs:{self.room_name}")
        if data:
            doc = Doc()
            doc.apply_update(bytes(data))
            self.doc = doc
            logger.info("Loaded snapshot for %s", self.room_name)
        else:
            self.doc["content"] = Map()
            self.doc["content"]["blocknote"] = Text()
            self.doc["content"]["excalidraw"] = Map()
            logger.info("Created new doc for %s", self.room_name)

    async def _save_snapshot(self):
        if self.doc is None:
            return
        update = self.doc.get_update()
        await self.redis.set(f"yjs:{self.room_name}", bytes(update))
        logger.debug("Saved snapshot for %s (%d bytes)", self.room_name, len(update))

    async def on_connect(self):
        await self._load_snapshot()

    async def on_disconnect(self):
        await self._save_snapshot()


async def main():
    redis = aioredis.from_url(REDIS_URL, decode_responses=False)
    await redis.ping()
    logger.info("Connected to Redis at %s", REDIS_URL)

    rooms: dict[str, DrawDocRoom] = {}

    def provider_factory(room_name: str) -> DrawDocRoom:
        if room_name not in rooms:
            rooms[room_name] = DrawDocRoom(room_name, redis)
        return rooms[room_name]

    ws_server = WebsocketServer(
        rooms_ready=True,
        auto_clean_rooms=True,
        provider_factory=provider_factory,
    )

    async with ws_server:
        asgi_app = ASGIServer(ws_server, async_mode=True)
        import uvicorn
        config = uvicorn.Config(asgi_app, host=HOST, port=PORT, log_level="info")
        server = uvicorn.Server(config)
        logger.info("WS server starting on %s:%s", HOST, PORT)
        await server.serve()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
