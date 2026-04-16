from app.schemas.common import CamelModel


class HealthResponse(CamelModel):
    status: str
    version: str
    database: str
