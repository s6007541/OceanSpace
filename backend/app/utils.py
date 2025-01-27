import heapq
import json
import socket
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from starlette.config import Config


def get_local_ip_address() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 1))  # connect() for UDP doesn't send packets
    local_ip_address = s.getsockname()[0]
    return local_ip_address


class APIKeyManager:
    class APIKeyContext:
        def __init__(self, manager: "APIKeyManager", key: str) -> None:
            self._manager = manager
            self._key = key

        def __enter__(self) -> str:
            return self._key

        def __exit__(self, *exc) -> None:
            self._manager.return_key(self._key)

    def __init__(self, keys: List[str]):
        self._heap: List[Tuple[int, int, str]] = []
        self._counter = 0

        for k in keys:
            self._counter += 1
            heapq.heappush(self._heap, (0, self._counter, k))

    @classmethod
    def from_str(cls, s: str, sep: Optional[str] = ",") -> "APIKeyManager":
        return cls([k.strip() for k in s.split(sep)])

    def context(self) -> "APIKeyManager.APIKeyContext":
        k = self.get_next_key()
        return APIKeyManager.APIKeyContext(self, k)

    def get_next_key(self) -> str:
        n, _, k = heapq.heappop(self._heap)
        self._counter += 1
        heapq.heappush(self._heap, (n + 1, self._counter, k))
        return k

    def return_key(self, key: str) -> None:
        for i in range(len(self._heap)):
            n, _, k = self._heap[i]
            if k == key:
                self._counter += 1
                self._heap[i] = (n - 1, self._counter, k)
                heapq.heapify(self._heap)
                break


env_file = Path("../.env")
ENV = Config(env_file if env_file.exists() else None)

with open(Path(__file__).parent.parent / "llm_config.json") as f:
    LLM_CONFIG: Dict[str, Any] = json.load(f)

AUTH_SECRET = "SECRET"
JWT_ALGORITHM = "HS256"
JWT_AUDIENCE = "fastapi-users:auth"
