import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.ai_complete import AICompleteResponse
from app.schemas.common import PaginatedResponse
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.schemas.seed_material import SimulationQueryRead
from app.services import ai_complete_service, project_service, seed_builder_service

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


@router.get("/{project_id}/simulation-query", response_model=SimulationQueryRead)
async def get_project_simulation_query(
    project_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> SimulationQueryRead:
    seed = await seed_builder_service.get_simulation_query_for_project(
        session, project_id
    )
    return SimulationQueryRead(
        project_id=project_id,
        scenario_id=seed.scenario_id,
        seed_material_id=seed.id,
        seed_status=seed.status,
        simulation_query=seed.simulation_query,
    )


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
