from pathlib import Path
from typing import Optional, Set

from email_validator import validate_email, EmailNotValidError
from fastapi import HTTPException, status
from fastapi_users.router.common import ErrorCode

from .config import ROOT_DIR


def normalize_email(email: str) -> str:
    emailinfo = validate_email(email, check_deliverability=False)
    return emailinfo.normalized


def load_whitelist(path: Path) -> Optional[Set[str]]:
    if not path.exists():
        return None

    whitelist = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                email = normalize_email(line)
                whitelist.append(email)
            except EmailNotValidError:
                pass
    return set(whitelist)


whitelist_path = ROOT_DIR / "whitelist.txt"
WHITELIST = load_whitelist(whitelist_path)


def is_whitelisted(email: str) -> bool:
    if WHITELIST is None:
        return True
    try:
        email = normalize_email(email)
    except EmailNotValidError:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            {"description": "Invalid email", "code": "2"},
        )
    return email in WHITELIST
