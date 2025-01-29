from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status

from ..db import User, UserDatabase, get_user_db
from ..schemas import UserModel
from ..users import current_active_user


router = APIRouter()


@router.get("")
async def get_current_user_info(user: User = Depends(current_active_user)) -> UserModel:
    return UserModel(
        id=str(user.id),
        email=user.email,
        username=user.username,
        alias=user.alias,
        avatar=user.avatar,
        pssList=user.pss_list,
        notification=user.notification,
        emergencyContact=user.emergency_contact,
    )


@router.get("/id/{user_id}")
async def get_user_info_by_id(
    user_id: str,
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


@router.get("/name/{username}")
async def get_user_info_by_name(
    username: str,
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


@router.put("")
async def update_user_info(
    body: Dict[str, Any] = Body(),
    user: User = Depends(current_active_user),
    user_db: UserDatabase = Depends(get_user_db),
):
    if "pss" in body:
        user.pss_list = user.pss_list + [body["pss"]]
    if "notification" in body:
        user.notification = body["notification"]
    if "emergencyContact" in body:
        user.emergency_contact = body["emergencyContact"]
    user_db.session.add(user)
    await user_db.session.commit()
    await user_db.session.refresh(user)
    return UserModel(
        id=str(user.id),
        email=user.email,
        username=user.username,
        alias=user.alias,
        avatar=user.avatar,
        pssList=user.pss_list,
        notification=user.notification,
        emergencyContact=user.emergency_contact,
    )
