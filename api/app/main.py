from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.shared.config import settings
from app.shared.errors import AppError, app_error_handler
from app.auth.router import router as auth_router
from app.workspaces.router import router as workspace_router
from app.documents.router import router as document_router
from app.users.router import router as users_router
from app.assets.router import router as assets_router
from app.demo.router import router as demo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="DrawDoc API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)

app.include_router(auth_router)
app.include_router(workspace_router)
app.include_router(document_router)
app.include_router(users_router)
app.include_router(assets_router)
app.include_router(demo_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
