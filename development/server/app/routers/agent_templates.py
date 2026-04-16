import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.agent_template import (
    AgentTemplateCreate,
    AgentTemplateRead,
    AgentTemplateUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services import agent_template_service

router = APIRouter(prefix="/api/agent-templates", tags=["agent-templates"])


@router.post("", response_model=AgentTemplateRead, status_code=201)
async def create_agent_template(
    data: AgentTemplateCreate, session: AsyncSession = Depends(get_session)
) -> AgentTemplateRead:
    template = await agent_template_service.create_agent_template(session, data)
    await session.commit()
    return AgentTemplateRead.model_validate(template, from_attributes=True)


@router.get("", response_model=PaginatedResponse[AgentTemplateRead])
async def list_agent_templates(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    role: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[AgentTemplateRead]:
    items, total = await agent_template_service.list_agent_templates(
        session, page, page_size, role
    )
    return PaginatedResponse[AgentTemplateRead](
        items=[AgentTemplateRead.model_validate(i, from_attributes=True) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{template_id}", response_model=AgentTemplateRead)
async def get_agent_template(
    template_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> AgentTemplateRead:
    template = await agent_template_service.get_agent_template(session, template_id)
    return AgentTemplateRead.model_validate(template, from_attributes=True)


@router.patch("/{template_id}", response_model=AgentTemplateRead)
async def update_agent_template(
    template_id: uuid.UUID,
    data: AgentTemplateUpdate,
    session: AsyncSession = Depends(get_session),
) -> AgentTemplateRead:
    template = await agent_template_service.update_agent_template(session, template_id, data)
    await session.commit()
    return AgentTemplateRead.model_validate(template, from_attributes=True)


@router.delete("/{template_id}", status_code=204)
async def delete_agent_template(
    template_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> None:
    await agent_template_service.soft_delete_agent_template(session, template_id)
    await session.commit()
