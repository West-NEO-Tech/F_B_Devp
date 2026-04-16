import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, event
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class BaseMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
        nullable=True,
    )


@event.listens_for(Session, "do_orm_execute")
def _apply_soft_delete_filter(execute_state):
    if execute_state.is_select and not execute_state.execution_options.get(
        "include_deleted", False
    ):
        # Walk the mapper entities in this query and add deleted_at IS NULL
        # for every entity that inherits BaseMixin.
        from sqlalchemy import inspect as sa_inspect

        entities = [
            d["entity"]
            for d in execute_state.statement.column_descriptions
            if d.get("entity") is not None
        ]
        for entity in entities:
            try:
                mapper = sa_inspect(entity)
                if hasattr(mapper.class_, "deleted_at"):
                    execute_state.statement = execute_state.statement.where(
                        mapper.class_.deleted_at.is_(None)
                    )
            except Exception:
                pass
