from app.db_url import migration_database_url, neon_direct_from_pooler, normalize_sync_migration_url


def test_neon_direct_from_pooler():
    pooler = (
        "postgresql://user:pass@ep-cool-pooler.us-east-2.aws.neon.tech/neondb"
        "?sslmode=require"
    )
    direct = neon_direct_from_pooler(pooler)
    assert direct is not None
    assert "-pooler" not in direct
    assert "ep-cool.us-east-2.aws.neon.tech" in direct


def test_migration_url_prefers_unpooled_env(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://u:p@ep-x-pooler.neon.tech/db?sslmode=require",
    )
    monkeypatch.setenv(
        "DATABASE_URL_UNPOOLED",
        "postgresql://u:p@ep-x.neon.tech/db?sslmode=require",
    )
    url = migration_database_url("postgresql+asyncpg://localhost/db")
    assert "-pooler" not in url
    assert url.startswith("postgresql+psycopg://")


def test_migration_url_derives_direct_from_pooler(monkeypatch):
    monkeypatch.delenv("DATABASE_URL_UNPOOLED", raising=False)
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://u:p@ep-y-pooler.neon.tech/db?sslmode=require",
    )
    url = migration_database_url(
        "postgresql+asyncpg://u:p@ep-y-pooler.neon.tech/db?sslmode=require"
    )
    assert "-pooler" not in url
    assert "sslmode=require" in url


def test_normalize_sync_strips_channel_binding():
    url = normalize_sync_migration_url(
        "postgresql://u:p@host/db?sslmode=require&channel_binding=require"
    )
    assert "channel_binding" not in url
