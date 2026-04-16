import uuid
from datetime import datetime

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseMixin


class SimulationRun(BaseMixin, Base):
    __tablename__ = "simulation_runs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'running', 'completed', 'failed')",
            name="ck_run_status",
        ),
        Index(
            "ix_run_scenario_id",
            "scenario_id",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    scenario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("simulation_scenarios.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="'pending'"
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    result_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    scenario = relationship("SimulationScenario", back_populates="runs")
