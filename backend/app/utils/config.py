import json
import socket
from pathlib import Path
from typing import Any, Dict

from starlette.config import Config


def get_local_ip_address() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 1))  # connect() for UDP doesn't send packets
    local_ip_address = s.getsockname()[0]
    return local_ip_address

# Path to the root directory of the project
ROOT_DIR = Path(__file__).parent.parent.parent.parent

# Environment variables
env_file = ROOT_DIR / ".env"
ENV = Config(env_file if env_file.exists() else None)

# LLM configuration
with open(Path(__file__).parent.parent.parent / "llm_config.json") as f:
    LLM_CONFIG: Dict[str, Any] = json.load(f)

AUTH_SECRET = "SECRET"
JWT_ALGORITHM = "HS256"
JWT_AUDIENCE = "fastapi-users:auth"
