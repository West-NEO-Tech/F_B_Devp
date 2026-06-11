import uuid

from sqlalchemy import JSON, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseMixin


class PreSimulationDisplay(BaseMixin, Base):
    """Display payload uploaded from the external simulation runner."""

    __tablename__ = "pre_simulation_displays"
    __table_args__ = (
        Index(
            "ix_pre_simulation_display_project_id",
            "project_id",
            unique=True,
            postgresql_where="deleted_at IS NULL",
        ),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), nullable=False
    )
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    agent_distribution: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    project = relationship("Project", back_populates="pre_simulation_display")
