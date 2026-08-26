from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url : str
    jwt_algorithm : str = "HS256"
    jwt_secret_key : str
    access_token_expire_minutes : int = 30
    refresh_token_expire_days : int = 7

    storage_path : str = "storage"
    max_upload_size_mb : int = 10
    groq_api_key : str = ""
    redis_url : str = "redis://localhost:6379/0"
    test_database_url : str = ""

    @field_validator("database_url")
    @classmethod
    def fix_postgres_scheme(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql://", 1)
        if "render.com" in v and "sslmode" not in v:
            separator = "&" if "?" in v else "?"
            v = f"{v}{separator}sslmode=require"
        return v

    class Config:
        env_file = ".env"
settings = Settings()