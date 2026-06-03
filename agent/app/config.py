from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://drawdoc:drawdoc@localhost:5432/drawdoc"
    redis_url: str = "redis://localhost:6379"
    groq_api_key: str = ""
    google_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {
        "env_file": ".env",
        "env_prefix": "AGENT_",
        "env_nested_delimiter": "__",
    }


settings = Settings()
