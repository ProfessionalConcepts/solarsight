"""EnergyIQ — settings loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Use asyncpg for Railway, Docker, and local PostgreSQL URLs."""
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    ADMIN_TOKEN: str
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    CONTACT_EMAIL: str = "admin@energyiq.ke"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return normalize_database_url(self.DATABASE_URL)


settings = Settings()
