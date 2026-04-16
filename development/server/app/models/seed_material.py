import uuid

from sqlalchemy import JSON, CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseMixin


class SeedMaterial(BaseMixin, Base):
    __tablename__ = "seed_materials"
    __table_args__ = (
        CheckConstraint(
            "status IN ('generating', 'completed', 'failed')",
            name="ck_seed_material_status",
        ),
        Index(
            "ix_seed_material_scenario_id",
            "scenario_id",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    scenario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("simulation_scenarios.id"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="'generating'"
    )
    market_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    competitors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    consumer_personas: Mapped[list | None] = mapped_column(JSON, nullable=True)
    discussion_topics: Mapped[list | None] = mapped_column(JSON, nullable=True)
    raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    scenario = relationship("SimulationScenario", back_populates="seed_materials")
