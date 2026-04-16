import logging
import time
import uuid
from contextvars import ContextVar
from typing import Any

from starlette.types import ASGIApp, Receive, Scope, Send

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

logger = logging.getLogger("bizsim.access")


class RequestLoggingMiddleware:
    """Pure ASGI middleware — avoids BaseHTTPMiddleware per-request task overhead."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        rid = str(uuid.uuid4())
        request_id_ctx.set(rid)
        scope.setdefault("state", {})["request_id"] = rid

        start = time.perf_counter()
        status_code = 500

        async def send_wrapper(message: Any) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", rid.encode()))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_wrapper)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        path = scope.get("path", "")
        method = scope.get("method", "")
        logger.info(
            "request",
            extra={
                "request_id": rid,
                "method": method,
                "path": path,
                "status": status_code,
                "duration_ms": duration_ms,
            },
        )
