import uuid
from typing import Optional, List

from fastapi_users import schemas
from pydantic import BaseModel


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class UserModel(BaseModel):
    id: str
    email: Optional[str] = None
    username: Optional[str] = None
    alias: Optional[str] = None
    avatar: Optional[str] = None
    pssList: List[str] = []