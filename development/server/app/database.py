from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings

if settings.is_serverless:
    # Serverless (Vercel): no connection pool — each invocation opens/closes one connection.
    # statement_cache_size=0 is required for Neon/PgBouncer transaction-mode poolers.
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        poolclass=NullPool,
        connect_args={"statement_cache_size": 0},
    )
else:
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        pool_timeout=30,
    )

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
