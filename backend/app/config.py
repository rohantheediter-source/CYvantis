import os
import secrets
import logging
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from backend directory or workspace root
load_dotenv()
_root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(_root_env):
    load_dotenv(_root_env)

logger = logging.getLogger("cyvantis.config")


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _resolve_secret_key() -> str:
    """
    SECRET_KEY must come from the environment. In development, if it is missing we
    generate an ephemeral random key (tokens are invalidated on restart) and warn.
    In production (ENVIRONMENT=production) a missing key is a fatal error.
    """
    key = os.getenv("SECRET_KEY", "").strip()
    if key:
        if len(key) < 32:
            logger.warning("SECRET_KEY is shorter than 32 characters; use a long random value.")
        return key
    if os.getenv("ENVIRONMENT", "development").lower() == "production":
        raise RuntimeError("SECRET_KEY environment variable is required when ENVIRONMENT=production")
    logger.warning("SECRET_KEY not set - generated an ephemeral key. Sessions will not survive restarts.")
    return secrets.token_urlsafe(48)


class Settings(BaseSettings):
    PROJECT_NAME: str = "CYVANTIS - Enterprise Gateway Intelligence & Security Nexus"
    VERSION: str = "1.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Security
    SECRET_KEY: str = _resolve_secret_key()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    # Comma-separated list of allowed browser origins. No wildcard is ever applied.
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    ALLOW_SELF_REGISTRATION: bool = _env_bool("ALLOW_SELF_REGISTRATION", False)
    MAX_FAILED_LOGINS: int = int(os.getenv("MAX_FAILED_LOGINS", "5"))
    LOCKOUT_MINUTES: int = int(os.getenv("LOCKOUT_MINUTES", "15"))
    PASSWORD_MIN_LENGTH: int = 12

    # Bootstrap accounts (only used when the users table is empty). If a password is
    # not supplied a random one is generated and printed once to the console.
    BOOTSTRAP_ADMIN_PASSWORD: str = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    BOOTSTRAP_ANALYST_PASSWORD: str = os.getenv("BOOTSTRAP_ANALYST_PASSWORD", "")
    BOOTSTRAP_VIEWER_PASSWORD: str = os.getenv("BOOTSTRAP_VIEWER_PASSWORD", "")

    # Database - SQLite Primary Storage
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cyvantis.db")
    # Seed ~220 historical *synthetic* events on an empty DB (labelled is_simulated=True)
    SEED_DEMO_DATA: bool = _env_bool("SEED_DEMO_DATA", True)

    # Cowrie Honeypot Integration
    COWRIE_LOG_PATH: str = os.getenv("COWRIE_LOG_PATH", "./data/cowrie.json")
    INGEST_INTERVAL_SECONDS: float = float(os.getenv("INGEST_INTERVAL_SECONDS", "2.0"))
    INGEST_MAX_LINES_PER_CYCLE: int = int(os.getenv("INGEST_MAX_LINES_PER_CYCLE", "2000"))
    INGEST_MAX_LINE_BYTES: int = 64 * 1024
    # Synthetic telemetry generator (demo mode). Off unless explicitly enabled.
    SIMULATION_MODE: bool = _env_bool("SIMULATION_MODE", False)
    SIMULATION_INTERVAL_SECONDS: float = float(os.getenv("SIMULATION_INTERVAL_SECONDS", "3.0"))
    # Disable all background workers (used by the test-suite)
    DISABLE_BACKGROUND_TASKS: bool = _env_bool("DISABLE_BACKGROUND_TASKS", False)

    # Threat Intelligence Integration (server-side only, never sent to the frontend)
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")
    NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
    INTEL_ENABLE_NETWORK: bool = _env_bool("INTEL_ENABLE_NETWORK", True)
    INTEL_CACHE_TTL_HOURS: int = int(os.getenv("INTEL_CACHE_TTL_HOURS", "24"))
    INTEL_HTTP_TIMEOUT_SECONDS: float = float(os.getenv("INTEL_HTTP_TIMEOUT_SECONDS", "8"))

    # Honeypot credential handling
    CAPTURED_CREDENTIAL_RETENTION_DAYS: int = int(os.getenv("CAPTURED_CREDENTIAL_RETENTION_DAYS", "30"))

    # Storage & Backups
    BACKUP_DIR: str = os.getenv("BACKUP_DIR", "./backups")
    RETENTION_DAYS: int = 90

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip() and o.strip() != "*"]

    class Config:
        case_sensitive = True
        env_file = None


settings = Settings()
