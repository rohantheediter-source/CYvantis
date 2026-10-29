import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CYVANTIS - Enterprise Gateway Intelligence & Security Nexus"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cyvantis_super_secret_jwt_key_2026_soc_enterprise_mode_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database - SQLite Primary Storage (NO PostgreSQL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cyvantis.db")
    
    # Cowrie Honeypot Integration
    COWRIE_LOG_PATH: str = os.getenv("COWRIE_LOG_PATH", "./data/cowrie.json")
    SIMULATION_MODE: bool = True # Enable realistic background event generator when log file is absent or for demo
    SIMULATION_INTERVAL_SECONDS: float = 3.0
    
    # Threat Intelligence Integration
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")
    
    # Storage & Backups
    BACKUP_DIR: str = os.getenv("BACKUP_DIR", "./backups")
    RETENTION_DAYS: int = 90

    class Config:
        case_sensitive = True

settings = Settings()
