import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from app.shared.database import get_db
from app.models import User
from app.auth.jwt import create_access_token, create_refresh_token, decode_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: str
    password: str
    display_name: str


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(body: RegisterBody, db: AsyncSession = Depends(get_db), response: Response = None):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=body.email,
        display_name=body.display_name,
        password_hash=bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode(),
    )
    db.add(user)
    await db.commit()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=False, samesite="lax", max_age=7 * 86400, path="/auth")

    return {"user": {"id": str(user.id), "email": user.email, "display_name": user.display_name}, "access_token": access_token}


@router.post("/login")
async def login(body: LoginBody, db: AsyncSession = Depends(get_db), response: Response = None):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=False, samesite="lax", max_age=7 * 86400, path="/auth")

    return {"user": {"id": str(user.id), "email": user.email, "display_name": user.display_name}, "access_token": access_token}


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    new_access = create_access_token(uuid.UUID(payload["sub"]))
    new_refresh = create_refresh_token(uuid.UUID(payload["sub"]))
    response.set_cookie("refresh_token", new_refresh, httponly=True, secure=False, samesite="lax", max_age=7 * 86400, path="/auth")

    return {"access_token": new_access}


@router.get("/me")
async def get_me(user_id: uuid.UUID = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": str(user.id), "email": user.email, "display_name": user.display_name, "avatar_url": user.avatar_url}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/auth")
    return {"ok": True}
