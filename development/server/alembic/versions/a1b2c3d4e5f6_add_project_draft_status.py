"""add_project_draft_status

Revision ID: a1b2c3d4e5f6
Revises: e0be03dab794
Create Date: 2026-03-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e0be03dab794"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.drop_constraint("ck_project_status", "projects", type_="check")
        op.create_check_constraint(
            "ck_project_status",
            "projects",
            "status IN ('draft', 'active', 'archived')",
        )
    # SQLite: no-op (CHECK constraints are not enforced the same way)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.drop_constraint("ck_project_status", "projects", type_="check")
        op.create_check_constraint(
            "ck_project_status",
            "projects",
            "status IN ('active', 'archived')",
        )
    # SQLite: no-op
