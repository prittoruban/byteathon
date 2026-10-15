from pathlib import Path
from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "HARVEST ZERO API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"

    # Supabase credentials (configured via .env, never hardcoded)
    SUPABASE_URL: str = Field(
        default="https://your-project-id.supabase.co",
        description="Supabase project URL",
    )
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = Field(
        default=None,
        description="Supabase Publishable/Anon Key",
    )
    SUPABASE_ANON_KEY: Optional[str] = Field(
        default=None,
        description="Supabase Anon Key alias",
    )
    SUPABASE_SECRET_KEY: Optional[str] = Field(
        default=None,
        description="Supabase Secret Key (Backend only, never expose to frontend)",
    )
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(
        default=None,
        description="Supabase Service Role Key alias (Backend only)",
    )
    SUPABASE_JWKS_URL: Optional[str] = Field(
        default=None,
        description="Supabase JWKS URL for token validation",
    )

    @property
    def public_key(self) -> str:
        """Return the active public/publishable key."""
        return self.SUPABASE_PUBLISHABLE_KEY or self.SUPABASE_ANON_KEY or ""

    @property
    def secret_key(self) -> str:
        """Return the active secret/service-role key."""
        return self.SUPABASE_SECRET_KEY or self.SUPABASE_SERVICE_ROLE_KEY or ""

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=(
            str(BASE_DIR / ".env"),
            str(BASE_DIR / ".env.local"),
            str(BASE_DIR.parent / ".env"),
            ".env",
            "backend/.env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
