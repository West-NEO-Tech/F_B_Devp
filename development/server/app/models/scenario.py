import uuid

from sqlalchemy import JSON, CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseMixin


class SimulationScenario(BaseMixin, Base):
    __tablename__ = "simulation_scenarios"
    __table_args__ = (
        CheckConstraint(
            "agent_depth IN ('quick', 'standard', 'deep', 'custom')",
            name="ck_scenario_agent_depth",
        ),
        CheckConstraint("agent_count > 0", name="ck_scenario_agent_count_positive"),
        Index(
            "ix_scenario_project_id",
            "project_id",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="100")
    agent_depth: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="'standard'"
    )
    market_config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    project = relationship("Project", back_populates="scenarios")
    runs = relationship(
        "SimulationRun", back_populates="scenario", cascade="all, delete-orphan"
    )
    seed_materials = relationship(
        "SeedMaterial", back_populates="scenario", cascade="all, delete-orphan"
    )
