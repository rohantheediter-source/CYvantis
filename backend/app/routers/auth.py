import datetime
import pyotp
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AuditLog
from app.schemas import (
    Token, UserResponse, UserLogin, PasswordChangeFirstLogin,
    TotpSetupResponse, TotpVerifyRequest, Login2faVerifyRequest, UserCreate
)
from app.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is disabled")

    # Password Verification (15-minute lockout removed)
    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Check 2FA requirement
    if user.is_totp_enabled:
        temp_token = create_access_token(
            data={"sub": user.username, "type": "2fa_pending"},
            expires_delta=datetime.timedelta(minutes=5)
        )

        qr_code_url = None
        if user.totp_secret:
            import io
            import base64
            import qrcode
            otpauth_url = pyotp.TOTP(user.totp_secret).provisioning_uri(
                name=user.username,
                issuer_name="CYVANTIS SOC"
            )
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=8,
                border=2,
            )
            qr.add_data(otpauth_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            qr_code_url = f"data:image/png;base64,{qr_base64}"

        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "username": user.username,
            "qr_code_url": qr_code_url,
            "totp_secret": user.totp_secret
        }

    # Reset lockout counters on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.datetime.utcnow()
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=user.id,
        username=user.username,
        action="USER_LOGIN",
        resource="Auth",
        details="User logged in successfully"
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Check existing username
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered. Please choose another username."
        )
    
    # 2. Check existing email
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered. Please sign in or use another email."
        )

    # 3. Validate password length
    if len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # 4. Create new user with analyst role
    # Self-registered users are analysts by default (Admin privileges locked)
    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        full_name=user_in.full_name or user_in.username.capitalize(),
        role="analyst",
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        must_change_password=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.flush()

    # 5. Log audit
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=new_user.id,
        username=new_user.username,
        action="USER_SELF_REGISTERED",
        resource="Auth",
        details=f"User self-registered as Analyst: {new_user.username} ({new_user.email})"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
        "message": "Account registered successfully with Analyst privileges."
    }

@router.post("/2fa/verify-login")
def verify_2fa_login(payload: Login2faVerifyRequest, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    from app.config import settings

    try:
        data = jwt.decode(payload.temp_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = data.get("sub")
        token_type = data.get("type")
        if not username or token_type != "2fa_pending":
            raise HTTPException(status_code=400, detail="Invalid 2FA session token")
    except JWTError:
        raise HTTPException(status_code=400, detail="2FA session token expired or invalid")

    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.totp_code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid 6-digit 2FA code. Please check Google Authenticator.")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.datetime.utcnow()
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=user.id,
        username=user.username,
        action="USER_LOGIN_2FA_VERIFIED",
        resource="Auth",
        details="User verified 2FA TOTP code successfully"
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/2fa/setup", response_model=TotpSetupResponse)
def setup_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import io
    import base64
    import qrcode

    # Generate new random base32 secret
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    db.commit()

    otpauth_url = pyotp.TOTP(secret).provisioning_uri(
        name=current_user.username,
        issuer_name="CYVANTIS SOC"
    )
    
    # Generate local high-resolution Base64 PNG QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=8,
        border=2,
    )
    qr.add_data(otpauth_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    qr_code_url = f"data:image/png;base64,{qr_base64}"

    return {
        "secret": secret,
        "qr_code_url": qr_code_url,
        "otpauth_url": otpauth_url
    }

@router.post("/2fa/enable", response_model=UserResponse)
def enable_2fa(payload: TotpVerifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Please initialize 2FA setup before enabling")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.totp_code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid 6-digit TOTP verification code")

    current_user.is_totp_enabled = True
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="2FA_ENABLED",
        resource="Auth",
        details="Enabled Two-Factor Authentication (TOTP)"
    )
    db.add(audit)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/2fa/disable", response_model=UserResponse)
def disable_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.is_totp_enabled = False
    current_user.totp_secret = None
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="2FA_DISABLED",
        resource="Auth",
        details="Disabled Two-Factor Authentication (TOTP)"
    )
    db.add(audit)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password-first-login", response_model=UserResponse)
def change_password_first_login(
    payload: PasswordChangeFirstLogin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
        
    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_change_password = False
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="FIRST_LOGIN_PASSWORD_CHANGED",
        resource="Auth",
        details="User successfully changed temporary password on first login"
    )
    db.add(audit)
    db.commit()
    db.refresh(current_user)
    return current_user
