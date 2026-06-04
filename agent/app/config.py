from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql+psycopg://drawdoc:drawdoc@localhost:5432/drawdoc",
        validation_alias="AGENT_DATABASE_URL",
    )
    redis_url: str = Field(
        default="redis://localhost:6379",
        validation_alias="AGENT_REDIS_URL",
    )
    groq_api_key: str = Field(
        default="",
        validation_alias="GROQ_API_KEY",
    )
    google_api_key: str = Field(
        default="",
        validation_alias="GOOGLE_API_KEY",
    )
    cors_origins: str = Field(
        default="http://localhost:3000",
        validation_alias="AGENT_CORS_ORIGINS",
    )

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
