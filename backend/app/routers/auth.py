from fastapi import APIRouter
from httpx_oauth.clients.google import GoogleOAuth2  # type: ignore

from ..schemas import UserCreate, UserRead
from ..users import auth_backends, fastapi_users
from ..utils.config import ENV


google_oauth_client = GoogleOAuth2(
    ENV.get("GOOGLE_CLIENT_ID"), ENV.get("GOOGLE_CLIENT_SECRET")
)

router = APIRouter()
router.include_router(fastapi_users.get_auth_router(auth_backends[0]), tags=["auth cookie"])
router.include_router(
    fastapi_users.get_auth_router(auth_backends[1]), prefix="/jwt", tags=["auth jwt"]
)
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
)
router.include_router(
    fastapi_users.get_reset_password_router(),
)
router.include_router(
    fastapi_users.get_verify_router(UserRead),
)
router.include_router(
    fastapi_users.get_oauth_router(
        google_oauth_client,
        auth_backends[1],
        ENV.get("GOOGLE_CLIENT_SECRET"),
        associate_by_email=True,
    ),
    prefix="/google",
    tags=["auth google"],
)
