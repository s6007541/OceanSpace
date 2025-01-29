from fastapi import APIRouter
from fastapi.responses import FileResponse


router = APIRouter()


@router.get("/{other_path:path}")
async def serve_react_app(other_path: str):
    return FileResponse("../frontend/dist/index.html")
