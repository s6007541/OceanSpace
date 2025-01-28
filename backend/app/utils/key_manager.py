import heapq
from typing import List, Optional, Tuple


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
