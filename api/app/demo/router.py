from fastapi import APIRouter

router = APIRouter(prefix="/demo", tags=["demo"])

DEMO_DOC_ID = "demo-workspace-doc"


@router.post("/reset")
async def reset_demo():
    from app.shared.database import async_session
    from app.models import DocSnapshot
    from sqlalchemy import delete

    async with async_session() as session:
        await session.execute(
            delete(DocSnapshot).where(DocSnapshot.doc_id == DEMO_DOC_ID)
        )
        await session.commit()

    return {"ok": True, "message": "Demo document reset"}
