import json
import uuid
from typing import Optional

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, exceptions
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    CookieTransport,
    JWTStrategy,
)
from fastapi_users.authentication.strategy.db import (
    AccessTokenDatabase,
    DatabaseStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from urllib.parse import quote

from .db import AccessToken, User, get_access_token_db, get_user_db
from .utils.config import AUTH_SECRET, ENV, JWT_ALGORITHM, JWT_AUDIENCE
from .utils.whitelist import is_whitelisted


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = AUTH_SECRET
    verification_token_secret = AUTH_SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        print(f"Verification requested for user {user.id}. Verification token: {token}")

    async def on_after_login(
        self,
        user: User,
        request: Optional[Request] = None,
        response: Optional[Response] = None,
    ) -> None:
        if request is not None:
            whitelisted = is_whitelisted(user.email)
            if request.url.path == "/api/auth/google/callback":
                assert response is not None
                error_code: Optional[int] = None
                frontend_url: str = ENV.get("FRONTEND_URL")
                if whitelisted:
                    if response.status_code == 204 or response.status_code == 200:
                        response.status_code = 307
                        access_token = json.loads(response.body)["access_token"]
                        response.headers["location"] = quote(
                            frontend_url + f"/AuthCallback?token={access_token}",
                            safe=":/%#?=@[]!$&'()*+,;",
                        )
                        return
                    error_code = 0
                else:
                    error_code = 1
                response.status_code = 307
                response.headers["location"] = quote(
                    frontend_url + f"/?error={error_code}", safe=":/%#?=@[]!$&'()*+,;"
                )
            else:
                if not whitelisted:
                    raise HTTPException(
                        status.HTTP_401_UNAUTHORIZED,
                        {"description": "Email not whitelisted", "code": "1"},
                    )

    async def authenticate(
        self, credentials: OAuth2PasswordRequestForm
    ) -> Optional[User]:
        """
        Authenticate and return a user following an email and a password.

        Will automatically upgrade password hash if necessary.

        :param credentials: The user credentials.
        """
        try:
            user = await self.get_by_email(credentials.username)
        except exceptions.UserNotExists:
            # Run the hasher to mitigate timing attack
            # Inspired from Django: https://code.djangoproject.com/ticket/20760
            self.password_helper.hash(credentials.password)
            return None

        verified, updated_password_hash = self.password_helper.verify_and_update(
            credentials.password, user.hashed_password
        )
        if not verified:
            return None
        # Update password hash to a more robust one if needed
        if updated_password_hash is not None:
            await self.user_db.update(user, {"hashed_password": updated_password_hash})

        return user


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


cookie_transport = CookieTransport(cookie_max_age=3600, cookie_secure=True)
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=AUTH_SECRET,
        lifetime_seconds=3600,
        algorithm=JWT_ALGORITHM,
        token_audience=[JWT_AUDIENCE],
    )


def get_database_strategy(
    access_token_db: AccessTokenDatabase[AccessToken] = Depends(get_access_token_db),
) -> DatabaseStrategy:
    return DatabaseStrategy(access_token_db, lifetime_seconds=3600)


auth_backends = [
    AuthenticationBackend(
        name="cookie", transport=cookie_transport, get_strategy=get_database_strategy
    ),
    AuthenticationBackend(
        name="jwt", transport=bearer_transport, get_strategy=get_jwt_strategy
    ),
]

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, auth_backends)

current_active_user = fastapi_users.current_user(active=True)
