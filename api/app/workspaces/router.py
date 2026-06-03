import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database import get_db
from app.models import Workspace, WorkspaceMember, Document
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class CreateWorkspaceBody(BaseModel):
    name: str


class UpdateWorkspaceBody(BaseModel):
    name: str | None = None
    slug: str | None = None


class InviteBody(BaseModel):
    email: str
    role: str = "editor"


@router.post("")
async def create_workspace(body: CreateWorkspaceBody, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    slug = body.name.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:8]
    ws = Workspace(id=uuid.uuid4(), name=body.name, slug=slug, owner_id=user_id)
    db.add(ws)
    member = WorkspaceMember(workspace_id=ws.id, user_id=user_id, role="owner")
    db.add(member)
    await db.commit()
    return {"id": str(ws.id), "name": ws.name, "slug": ws.slug}


@router.get("")
async def list_workspaces(user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workspace).join(WorkspaceMember).where(WorkspaceMember.user_id == user_id)
    )
    workspaces = result.scalars().all()
    return [
        {"id": str(w.id), "name": w.name, "slug": w.slug, "created_at": w.created_at.isoformat()}
        for w in workspaces
    ]


@router.get("/{slug}")
async def get_workspace(slug: str, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    members_result = await db.execute(
        select(WorkspaceMember).where(WorkspaceMember.workspace_id == ws.id)
    )
    members = members_result.scalars().all()

    docs_result = await db.execute(
        select(Document).where(Document.workspace_id == ws.id).order_by(Document.updated_at.desc())
    )
    docs = docs_result.scalars().all()

    return {
        "id": str(ws.id),
        "name": ws.name,
        "slug": ws.slug,
        "members": [
            {"user_id": str(m.user_id), "role": m.role, "joined_at": m.joined_at.isoformat()}
            for m in members
        ],
        "documents": [
            {"id": str(d.id), "title": d.title, "view_mode": d.view_mode, "updated_at": d.updated_at.isoformat()}
            for d in docs
        ],
    }


@router.put("/{slug}")
async def update_workspace(slug: str, body: UpdateWorkspaceBody, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if ws.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only owner can update workspace")

    if body.name is not None:
        ws.name = body.name
    if body.slug is not None:
        ws.slug = body.slug
    await db.commit()
    return {"id": str(ws.id), "name": ws.name, "slug": ws.slug}


@router.delete("/{slug}")
async def delete_workspace(slug: str, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if ws.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only owner can delete workspace")
    await db.execute(delete(Document).where(Document.workspace_id == ws.id))
    await db.delete(ws)
    await db.commit()
    return {"ok": True}
