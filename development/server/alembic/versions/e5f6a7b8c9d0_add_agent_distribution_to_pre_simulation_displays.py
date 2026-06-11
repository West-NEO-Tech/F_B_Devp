"""add agent_distribution to pre_simulation_displays

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-13 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "pre_simulation_displays",
        sa.Column("agent_distribution", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pre_simulation_displays", "agent_distribution")
