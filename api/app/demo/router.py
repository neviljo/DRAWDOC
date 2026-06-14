import uuid
from fastapi import APIRouter

router = APIRouter(prefix="/demo", tags=["demo"])

DEMO_DOC_ID = "da777777-7777-7777-7777-777777777777"


@router.post("/reset")
async def reset_demo():
    from app.shared.database import async_session
    from app.models import DocSnapshot
    from sqlalchemy import delete

    async with async_session() as session:
        await session.execute(
            delete(DocSnapshot).where(DocSnapshot.doc_id == uuid.UUID(DEMO_DOC_ID))
        )
        await session.commit()

    return {"ok": True, "message": "Demo document reset"}

