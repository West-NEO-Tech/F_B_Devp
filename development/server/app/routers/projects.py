import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.ai_complete import AICompleteResponse
from app.schemas.common import PaginatedResponse
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services import ai_complete_service, project_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(
    data: ProjectCreate, session: AsyncSession = Depends(get_session)
) -> ProjectRead:
    project = await project_service.create_project(session, data)
    await session.commit()
    return ProjectRead.model_validate(project, from_attributes=True)


@router.get("", response_model=PaginatedResponse[ProjectRead])
async def list_projects(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    status: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[ProjectRead]:
    items, total = await project_service.list_projects(session, page, page_size, status)
    return PaginatedResponse[ProjectRead](
        items=[ProjectRead.model_validate(i, from_attributes=True) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> ProjectRead:
    project = await project_service.get_project(session, project_id)
    return ProjectRead.model_validate(project, from_attributes=True)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
) -> ProjectRead:
    project = await project_service.update_project(session, project_id, data)
    await session.commit()
    return ProjectRead.model_validate(project, from_attributes=True)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> None:
    await project_service.soft_delete_project(session, project_id)
    await session.commit()


@router.post("/{project_id}/ai-complete", response_model=AICompleteResponse)
async def ai_complete_project(
    project_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> AICompleteResponse:
    project = await project_service.get_project(session, project_id)
    return await ai_complete_service.generate_completions(project)
