from sqlalchemy import JSON, CheckConstraint, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseMixin


class Project(BaseMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'active', 'archived')", name="ck_project_status"),
        Index("ix_project_status", "status", postgresql_where="deleted_at IS NULL"),
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_market: Mapped[str | None] = mapped_column(String(200), nullable=True)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    pricing_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    competitors: Mapped[dict | list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="active"
    )

    scenarios = relationship(
        "SimulationScenario", back_populates="project", cascade="all, delete-orphan"
    )
