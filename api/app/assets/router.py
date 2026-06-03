import uuid
from fastapi import APIRouter, Depends
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("/presign")
async def presign_upload(user_id: uuid.UUID = Depends(get_current_user)):
    return {"upload_url": "https://placeholder.r2.dev/upload", "file_key": f"uploads/{uuid.uuid4()}"}
