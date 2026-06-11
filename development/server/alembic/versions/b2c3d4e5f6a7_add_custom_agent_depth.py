"""add custom agent_depth option

Revision ID: b2c3d4e5f6a7
Revises: 08af157c9279
Create Date: 2026-06-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "08af157c9279"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.drop_constraint("ck_scenario_agent_depth", "simulation_scenarios", type_="check")
        op.create_check_constraint(
            "ck_scenario_agent_depth",
            "simulation_scenarios",
            "agent_depth IN ('quick', 'standard', 'deep', 'custom')",
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.drop_constraint("ck_scenario_agent_depth", "simulation_scenarios", type_="check")
        op.create_check_constraint(
            "ck_scenario_agent_depth",
            "simulation_scenarios",
            "agent_depth IN ('quick', 'standard', 'deep')",
        )
