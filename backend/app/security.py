import datetime
import re
import bcrypt
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

ROLE_ADMIN = "admin"
ROLE_ANALYST = "analyst"
ROLE_VIEWER = "viewer"
VALID_ROLES = {ROLE_ADMIN, ROLE_ANALYST, ROLE_VIEWER}

ACCESS_TOKEN_TYPE = "access"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    # bcrypt only uses the first 72 bytes
    pwd_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')


def validate_password_policy(password: str) -> Optional[str]:
    """Returns an error message if the password violates policy, otherwise None."""
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long."
    classes = sum(bool(re.search(p, password)) for p in (r"[a-z]", r"[A-Z]", r"\d", r"[^A-Za-z0-9]"))
    if classes < 3:
        return "Password must contain at least three of: lowercase, uppercase, digit, symbol."
    return None


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    to_encode.setdefault("type", ACCESS_TOKEN_TYPE)
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + (expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def resolve_user_from_token(db: Session, auth_token: Optional[str]) -> Optional[models.User]:
    """Validates an access token and returns the active user, or None. Used by HTTP and WebSocket auth."""
    if not auth_token:
        return None
    try:
        payload = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    # Reject 2FA-pending and any other non-access token types
    if payload.get("type", ACCESS_TOKEN_TYPE) != ACCESS_TOKEN_TYPE:
        return None
    username = payload.get("sub")
    if not username:
        return None
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None or not user.is_active:
        return None
    return user


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> models.User:
    user = resolve_user_from_token(db, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your role is not authorized to perform this operation."
            )
        return current_user
    return role_checker


require_admin = require_roles([ROLE_ADMIN])
require_analyst = require_roles([ROLE_ADMIN, ROLE_ANALYST])


REDACTED = "[REDACTED]"


def can_view_captured_credentials(user: Optional[models.User]) -> bool:
    """Honeypot-captured passwords are sensitive; only administrators may view them."""
    return bool(user and user.role == ROLE_ADMIN)


def redact_secret(value: Optional[str]) -> Optional[str]:
    return REDACTED if value else value
