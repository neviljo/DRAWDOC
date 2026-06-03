import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database import get_db
from app.models import Document, Workspace, WorkspaceMember
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/workspaces/{slug}/docs", tags=["documents"])


class CreateDocBody(BaseModel):
    title: str = "Untitled"


class UpdateDocBody(BaseModel):
    title: str | None = None
    view_mode: str | None = None


async def get_workspace(slug: str, user_id: uuid.UUID, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).join(WorkspaceMember).where(
            Workspace.slug == slug, WorkspaceMember.user_id == user_id
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws


async def check_member(ws_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession, require_role: str | None = None):
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == ws_id, WorkspaceMember.user_id == user_id
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    if require_role and member.role != require_role and member.role != "owner":
        raise HTTPException(status_code=403, detail=f"Role '{require_role}' required")
    return member


@router.post("")
async def create_document(slug: str, body: CreateDocBody, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ws = await get_workspace(slug, user_id, db)
    await check_member(ws.id, user_id, db)
    doc = Document(id=uuid.uuid4(), workspace_id=ws.id, title=body.title, created_by=user_id)
    db.add(doc)
    await db.commit()
    return {"id": str(doc.id), "title": doc.title, "view_mode": doc.view_mode}


@router.get("")
async def list_documents(
    slug: str,
    q: str = Query(None),
    sort: str = Query("updated_at"),
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws = await get_workspace(slug, user_id, db)
    stmt = select(Document).where(Document.workspace_id == ws.id)
    if q:
        stmt = stmt.where(Document.title.ilike(f"%{q}%"))
    if sort == "updated_at":
        stmt = stmt.order_by(Document.updated_at.desc())
    else:
        stmt = stmt.order_by(Document.created_at.desc())
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return [
        {"id": str(d.id), "title": d.title, "view_mode": d.view_mode, "updated_at": d.updated_at.isoformat(), "created_at": d.created_at.isoformat()}
        for d in docs
    ]


@router.get("/{doc_id}")
async def get_document(slug: str, doc_id: uuid.UUID, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ws = await get_workspace(slug, user_id, db)
    result = await db.execute(select(Document).where(Document.id == doc_id, Document.workspace_id == ws.id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": str(doc.id),
        "title": doc.title,
        "view_mode": doc.view_mode,
        "is_public": doc.is_public,
        "updated_at": doc.updated_at.isoformat(),
        "created_at": doc.created_at.isoformat(),
    }


@router.patch("/{doc_id}")
async def update_document(slug: str, doc_id: uuid.UUID, body: UpdateDocBody, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ws = await get_workspace(slug, user_id, db)
    await check_member(ws.id, user_id, db)
    result = await db.execute(select(Document).where(Document.id == doc_id, Document.workspace_id == ws.id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if body.title is not None:
        doc.title = body.title
    if body.view_mode is not None:
        doc.view_mode = body.view_mode
    await db.commit()
    return {"id": str(doc.id), "title": doc.title, "view_mode": doc.view_mode}


@router.delete("/{doc_id}")
async def delete_document(slug: str, doc_id: uuid.UUID, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ws = await get_workspace(slug, user_id, db)
    await check_member(ws.id, user_id, db)
    result = await db.execute(select(Document).where(Document.id == doc_id, Document.workspace_id == ws.id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()
    return {"ok": True}
