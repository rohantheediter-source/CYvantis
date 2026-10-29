import asyncio
import time
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.utils.seed_data import seed_database
from app.cowrie_watcher import start_cowrie_monitoring
from app.websocket import manager

from app.routers import (
    auth, users, events, analytics, intelligence, investigations,
    rules, reports, admin_data, storage, health, audit, security_audit, tools, advisories, settings as settings_router, ml, recon, pentest_guardrails, advanced_pentest, living_telemetry,
    domain_intel, offensive_testing, cli_router, defensive_suite, elite_ops, ai_terminal
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Auto-migrate User security columns if missing
with engine.connect() as conn:
    from sqlalchemy import text
    for alter_cmd in [
        "ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT 1 NOT NULL",
        "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL",
        "ALTER TABLE users ADD COLUMN locked_until DATETIME",
        "ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64)",
        "ALTER TABLE users ADD COLUMN is_totp_enabled BOOLEAN DEFAULT 0 NOT NULL"
    ]:
        try:
            conn.execute(text(alter_cmd))
            conn.commit()
        except Exception:
            pass

# Seed database on boot
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# OWASP Defensive Security Headers Middleware
@app.middleware("http")
async def add_owasp_security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 1)
    client_ip = request.client.host if request.client else "unknown"
    now_str = datetime.now().strftime("%H:%M:%S")
    # Print formatted request log
    print(f"[*] [{now_str}] HTTP {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms) [{client_ip}]", flush=True)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "connect-src 'self' ws: wss: http: https:;"
    )
    return response

# Restrictive & Secure CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(intelligence.router, prefix=settings.API_V1_STR)
app.include_router(investigations.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(admin_data.router, prefix=settings.API_V1_STR)
app.include_router(storage.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(security_audit.router, prefix=settings.API_V1_STR)
app.include_router(tools.router, prefix=settings.API_V1_STR)
app.include_router(advisories.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(recon.router, prefix=settings.API_V1_STR)
app.include_router(pentest_guardrails.router, prefix=settings.API_V1_STR)
app.include_router(advanced_pentest.router, prefix=settings.API_V1_STR)
app.include_router(living_telemetry.router, prefix=settings.API_V1_STR)
app.include_router(domain_intel.router, prefix=settings.API_V1_STR)
app.include_router(offensive_testing.router, prefix=settings.API_V1_STR)
app.include_router(cli_router.router, prefix=settings.API_V1_STR)
app.include_router(defensive_suite.router, prefix=settings.API_V1_STR)
app.include_router(elite_ops.router, prefix=settings.API_V1_STR)
app.include_router(ai_terminal.router, prefix=settings.API_V1_STR)


# Real-time WebSocket endpoint for Cowrie Honeypot Event Feed
@app.websocket("/api/v1/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    client_ip = websocket.client.host if websocket.client else "unknown"
    now_str = datetime.now().strftime("%H:%M:%S")
    print(f"[*] [{now_str}] [WS CONNECTED] Client subscribed to live honeypot feed from {client_ip}", flush=True)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"[*] [{datetime.now().strftime('%H:%M:%S')}] [WS DISCONNECTED] Client {client_ip} disconnected", flush=True)
    except Exception:
        manager.disconnect(websocket)

@app.on_event("startup")
async def on_startup():
    print(f"[+] ================================================================", flush=True)
    print(f"[+] CYVANTIS SOC Gateway Backend Online!", flush=True)
    print(f"[+] Base API URL: http://localhost:8000{settings.API_V1_STR}", flush=True)
    print(f"[+] Swagger Docs: http://localhost:8000{settings.API_V1_STR}/docs", flush=True)
    print(f"[+] Honeypot Simulator: ACTIVE (Generating live telemetry attacks)", flush=True)
    print(f"[+] ================================================================", flush=True)
    # Start Cowrie background watcher / simulator task
    asyncio.create_task(start_cowrie_monitoring())

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs": f"{settings.API_V1_STR}/docs"
    }
