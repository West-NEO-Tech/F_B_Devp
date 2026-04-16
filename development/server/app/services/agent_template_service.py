import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_template import AgentTemplate
from app.schemas.agent_template import AgentTemplateCreate, AgentTemplateUpdate


async def create_agent_template(
    session: AsyncSession, data: AgentTemplateCreate
) -> AgentTemplate:
    template = AgentTemplate(**data.model_dump())
    session.add(template)
    await session.flush()
    await session.refresh(template)
    return template


async def list_agent_templates(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    role: str | None = None,
) -> tuple[list[AgentTemplate], int]:
    query = select(AgentTemplate).where(AgentTemplate.deleted_at.is_(None))
    if role:
        query = query.where(AgentTemplate.role == role)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    query = query.order_by(AgentTemplate.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(query)
    return list(result.scalars().all()), total


async def get_agent_template(
    session: AsyncSession, template_id: uuid.UUID
) -> AgentTemplate:
    query = select(AgentTemplate).where(
        AgentTemplate.id == template_id, AgentTemplate.deleted_at.is_(None)
    )
    result = await session.execute(query)
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Agent template not found")
    return template


async def update_agent_template(
    session: AsyncSession, template_id: uuid.UUID, data: AgentTemplateUpdate
) -> AgentTemplate:
    template = await get_agent_template(session, template_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
    template.updated_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(template)
    return template


async def soft_delete_agent_template(
    session: AsyncSession, template_id: uuid.UUID
) -> None:
    template = await get_agent_template(session, template_id)
    template.deleted_at = datetime.now(timezone.utc)
    await session.flush()
