import os
from PIL import Image
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from ..db import UserDatabase, get_user_db

router = APIRouter()


@router.get("/{user_id}")
async def get_profile_image(
    user_id: str,
    user_db: UserDatabase = Depends(get_user_db),
):
    other_user = await user_db.get(UUID(user_id))

    if other_user is None:
        raise HTTPException(status_code=404, detail="Not found.")

    avatar = other_user.avatar
    if avatar is None or not os.path.exists(avatar):
        raise HTTPException(status_code=404, detail="Not found")

    if avatar.endswith(".svg"):
        return Response(content=open(avatar, "rb").read(), media_type="image/svg+xml")

    img = Image.open(avatar)
    img_bytes = img.tobytes()
    img_format = img.format
    assert img_format is not None
    return Response(content=img_bytes, media_type=f"image/{img_format.lower()}")
