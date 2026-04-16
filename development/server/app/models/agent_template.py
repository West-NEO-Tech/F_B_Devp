from sqlalchemy import JSON, CheckConstraint, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, BaseMixin


class AgentTemplate(BaseMixin, Base):
    __tablename__ = "agent_templates"
    __table_args__ = (
        CheckConstraint(
            "model_tier IN ('core', 'community', 'edge')",
            name="ck_agent_template_model_tier",
        ),
        Index(
            "ix_agent_template_role",
            "role",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_tier: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="'community'"
    )
    typical_count_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    typical_count_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    default_config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
