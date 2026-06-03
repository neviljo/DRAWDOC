from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, title: str, status: int, detail: str, code: str):
        self.title = title
        self.status = status
        self.detail = detail
        self.code = code


class NotFoundError(AppError):
    def __init__(self, resource: str, id: str):
        super().__init__(
            title="Not Found",
            status=404,
            detail=f"{resource} not found: {id}",
            code="NOT_FOUND",
        )


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(title="Unauthorized", status=401, detail=detail, code="UNAUTHORIZED")


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(title="Forbidden", status=403, detail=detail, code="FORBIDDEN")


class ValidationError(AppError):
    def __init__(self, errors: list[dict]):
        super().__init__(title="Validation Error", status=422, detail="Input validation failed", code="VALIDATION_ERROR")
        self.errors = errors


async def app_error_handler(request: Request, exc: AppError):
    content = {
        "title": exc.title,
        "status": exc.status,
        "detail": exc.detail,
        "code": exc.code,
        "request_id": getattr(request.state, "request_id", None),
    }
    if hasattr(exc, "errors"):
        content["errors"] = exc.errors
    return JSONResponse(status_code=exc.status, content=content)
