import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database import get_db
from app.models import User
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


class UpdateProfileBody(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None


@router.get("/me")
async def get_me(user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
    }


@router.patch("/me")
async def update_me(body: UpdateProfileBody, user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if body.display_name is not None:
        user.display_name = body.display_name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    await db.commit()
    return {"id": str(user.id), "email": user.email, "display_name": user.display_name, "avatar_url": user.avatar_url}
