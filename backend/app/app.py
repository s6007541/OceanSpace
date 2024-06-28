from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status

from .db import User, UserDatabase, create_db_and_tables, get_user_db
from .schemas import UserCreate, UserModel, UserRead, UserUpdate
from .users import auth_backends, current_active_user, fastapi_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Not needed if you setup a migration system like Alembic
    await create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(
    fastapi_users.get_auth_router(auth_backends[0]),
    prefix="/auth",
    tags=["auth cookie"],
)
app.include_router(
    fastapi_users.get_auth_router(auth_backends[1]),
    prefix="/auth/jwt",
    tags=["auth jwt"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


@app.get("/user-info", tags=["user info"])
async def get_current_user_info(user: User = Depends(current_active_user)) -> UserModel:
    return UserModel(
        id=str(user.id),
        email=user.email,
        username=user.username,
        alias=user.alias,
        avatar=user.avatar,
        pssList=user.pss_list,
    )


@app.get("/user-info/id/{user_id}", tags=["user info"])
async def get_user_info_by_id(
    user_id: str,
    user: User = Depends(current_active_user),
    user_db: UserDatabase = Depends(get_user_db),
) -> UserModel:
    fetched_user = await user_db.get(UUID(user_id))
    if fetched_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return UserModel(
        id=str(fetched_user.id),
        username=fetched_user.username,
        alias=fetched_user.alias,
        avatar=fetched_user.avatar,
    )


@app.get("/user-info/name/{username}", tags=["user info"])
async def get_user_info_by_name(
    username: str,
    user: User = Depends(current_active_user),
    user_db: UserDatabase = Depends(get_user_db),
) -> UserModel:
    fetched_user = await user_db.get_by_username(username)
    if fetched_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return UserModel(
        id=str(fetched_user.id),
        username=fetched_user.username,
        alias=fetched_user.alias,
        avatar=fetched_user.avatar,
    )
