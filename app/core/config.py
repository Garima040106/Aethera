"""Application configuration settings."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "Saans Saathi API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # AWS Settings
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""

    # Bedrock Model IDs
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    BEDROCK_FALLBACK_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"

    # Simulation & Fallback controls
    ENABLE_LOCAL_AGENT_FALLBACK: bool = True
    ENABLE_FIXTURE_REPLAY_MODE: bool = True
    MAX_FORECAST_HORIZON_HOURS: int = 72
    DEFAULT_FORECAST_AREA: str = "noida"

    # External APIs (Optional)
    NASA_FIRMS_MAP_KEY: str = ""
    OPENAQ_API_KEY: str = ""


settings = Settings()
