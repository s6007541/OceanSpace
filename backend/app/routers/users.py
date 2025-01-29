from fastapi import APIRouter

from ..schemas import UserRead, UserUpdate
from ..users import fastapi_users

router = APIRouter()
router.include_router(fastapi_users.get_users_router(UserRead, UserUpdate))
