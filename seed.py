"""
Seed script: creates demo users, workspaces, documents, and AI history.

Usage: uv run python seed.py
"""
import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from passlib.hash import bcrypt

from app.shared.database import Base
from app.shared.config import settings
from app.models import User, Workspace, WorkspaceMember, Document, DocSnapshot

DEMO_USERS = [
    {"email": "alice@drawdoc.demo", "password": "demo1234", "display_name": "Alice Demo"},
    {"email": "bob@drawdoc.demo", "password": "demo1234", "display_name": "Bob Demo"},
    {"email": "demo@drawdoc.demo", "password": "demo1234", "display_name": "Demo User"},
]

DEMO_WORKSPACES = [
    {"name": "Acme Engineering", "slug": "acme-engineering", "owner_email": "alice@drawdoc.demo"},
    {"name": "Design Team", "slug": "design-team", "owner_email": "bob@drawdoc.demo"},
]

DEMO_DOCUMENTS = [
    {"title": "System Architecture Overview", "workspace_slug": "acme-engineering", "created_by_email": "alice@drawdoc.demo"},
    {"title": "API Design Notes", "workspace_slug": "acme-engineering", "created_by_email": "alice@drawdoc.demo"},
    {"title": "Sprint Planning Q2", "workspace_slug": "design-team", "created_by_email": "bob@drawdoc.demo"},
]

DEMO_DOC_ID = "demo-workspace-doc"


async def seed():
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_sessionmaker(engine, class_=AsyncSession)() as session:
        users = {}
        for u in DEMO_USERS:
            result = await session.execute(select(User).where(User.email == u["email"]))
            existing = result.scalar_one_or_none()
            if existing:
                users[u["email"]] = existing
                continue
            user = User(
                id=uuid.uuid4(),
                email=u["email"],
                display_name=u["display_name"],
                password_hash=bcrypt.hash(u["password"]),
            )
            session.add(user)
            users[u["email"]] = user

        workspaces = {}
        for w in DEMO_WORKSPACES:
            result = await session.execute(select(Workspace).where(Workspace.slug == w["slug"]))
            existing = result.scalar_one_or_none()
            if existing:
                workspaces[w["slug"]] = existing
                continue
            owner = users[w["owner_email"]]
            ws = Workspace(id=uuid.uuid4(), name=w["name"], slug=w["slug"], owner_id=owner.id)
            session.add(ws)
            member = WorkspaceMember(workspace_id=ws.id, user_id=owner.id, role="owner")
            session.add(member)
            workspaces[w["slug"]] = ws

        # Seed demo document for public sandbox
        result = await session.execute(select(Document).where(Document.id == DEMO_DOC_ID))
        if not result.scalar_one_or_none():
            demo_ws = workspaces["acme-engineering"]
            doc = Document(
                id=DEMO_DOC_ID,
                workspace_id=demo_ws.id,
                title="Demo Document",
                created_by=users["alice@drawdoc.demo"].id,
                is_public=True,
            )
            session.add(doc)

        await session.commit()

    await engine.dispose()
    print("Seed complete!")
    print("Demo accounts:")
    for u in DEMO_USERS:
        print(f"  {u['email']} / {u['password']}")


if __name__ == "__main__":
    asyncio.run(seed())
