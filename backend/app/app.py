from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import (
    auth,
    frontend,
    messages,
    profile_image,
    pss,
    user_chats,
    user_info,
    users,
    websocket,
)
from .db import create_db_and_tables
from .scheduler import get_notification_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Not needed if you setup a migration system like Alembic
    await create_db_and_tables()
    await get_notification_scheduler().start()
    yield


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(user_info.router, prefix="/user-info", tags=["user-info"])
api_router.include_router(
    profile_image.router, prefix="/profile-image", tags=["profile-image"]
)
api_router.include_router(user_chats.router, prefix="/user-chats", tags=["user-chats"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(pss.router, prefix="/pss", tags=["pss"])
api_router.include_router(websocket.router, tags=["websocket"])

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets")
app.mount("/static", StaticFiles(directory="../frontend/dist/static"), name="static")
app.include_router(api_router, prefix="/api")
app.include_router(frontend.router)
