import time
from typing import Awaitable, Callable, Generic, Optional, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: float):
        self._ttl = ttl_seconds
        self._value: Optional[T] = None
        self._fetched_at: float = 0.0

    def is_valid(self) -> bool:
        return self._value is not None and (time.monotonic() - self._fetched_at) < self._ttl

    def get(self) -> Optional[T]:
        return self._value if self.is_valid() else None

    def set(self, value: T) -> None:
        self._value = value
        self._fetched_at = time.monotonic()

    def invalidate(self) -> None:
        self._value = None

    async def get_or_fetch(self, fetch: Callable[[], Awaitable[T]], force: bool = False) -> T:
        if not force:
            cached = self.get()
            if cached is not None:
                return cached
        value = await fetch()
        self.set(value)
        return value
