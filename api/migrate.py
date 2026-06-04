import asyncio
import sys
from app.shared.database import engine
from app.models import Base


async def migrate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created!")


if __name__ == "__main__":
    asyncio.run(migrate())
    sys.exit(0)
