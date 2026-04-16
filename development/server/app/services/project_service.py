import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


async def create_project(session: AsyncSession, data: ProjectCreate) -> Project:
    project = Project(**data.model_dump(exclude_unset=True))
    session.add(project)
    await session.flush()
    await session.refresh(project)
    return project


async def list_projects(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
) -> tuple[list[Project], int]:
    query = select(Project).where(Project.deleted_at.is_(None))
    if status:
        query = query.where(Project.status == status)
    else:
        query = query.where(Project.status != "draft")

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    query = query.order_by(Project.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(query)
    return list(result.scalars().all()), total


async def get_project(session: AsyncSession, project_id: uuid.UUID) -> Project:
    query = select(Project).where(
        Project.id == project_id, Project.deleted_at.is_(None)
    )
    result = await session.execute(query)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def update_project(
    session: AsyncSession, project_id: uuid.UUID, data: ProjectUpdate
) -> Project:
    project = await get_project(session, project_id)
    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] == "draft":
        if project.status in ("active", "archived"):
            raise HTTPException(
                status_code=409,
                detail=f"Cannot transition from {project.status} to draft",
            )
    for key, value in update_data.items():
        setattr(project, key, value)
    project.updated_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(project)
    return project


async def soft_delete_project(
    session: AsyncSession, project_id: uuid.UUID
) -> None:
    project = await get_project(session, project_id)
    project.deleted_at = datetime.now(timezone.utc)
    await session.flush()
