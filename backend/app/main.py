import asyncio
import logging
import time
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal, upgrade_schema
from app.utils.seed_data import seed_database
from app.detection.engine import ensure_default_rules
from app.cowrie_watcher import start_cowrie_monitoring
from app.websocket import manager
from app.security import get_current_user, require_analyst, resolve_user_from_token

from app.routers import (
    auth, users, events, analytics, intelligence, investigations,
    rules, reports, admin_data, storage, health, audit, security_audit, tools, advisories, settings as settings_router, ml, recon, pentest_guardrails, advanced_pentest, living_telemetry,
    domain_intel, offensive_testing, cli_router, defensive_suite, elite_ops, ai_terminal,
    ingest, incidents, threat_intel, assets
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("cyvantis")

# Initialize / upgrade database schema (creates tables, adds missing columns)
upgrade_schema()

# Seed bootstrap accounts, default rules and (optionally) labelled demo data
_db = SessionLocal()
try:
    seed_database(_db)
    ensure_default_rules(_db)
finally:
    _db.close()

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
    # Path only - query strings are never logged
    print(f"[*] [{now_str}] HTTP {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms) [{client_ip}]", flush=True)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Cache-Control"] = response.headers.get("Cache-Control", "no-store")
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "connect-src 'self' ws: wss:;"
    )
    return response

# CORS: explicit allow-list from CORS_ORIGINS (no wildcard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Core routers (each endpoint declares its own auth dependencies)
for r in (auth, users, events, analytics, intelligence, investigations, rules, reports, admin_data, storage,
          health, audit, security_audit, tools, advisories, settings_router, ml, cli_router, ai_terminal,
          ingest, incidents, threat_intel, assets):
    app.include_router(r.router, prefix=settings.API_V1_STR)

# Simulated / educational modules (static or generated content, not part of the CTI pipeline).
# Previously unauthenticated - now require a logged-in analyst or admin.
for r in (recon, pentest_guardrails, advanced_pentest, living_telemetry, domain_intel, offensive_testing,
          defensive_suite, elite_ops):
    app.include_router(r.router, prefix=settings.API_V1_STR, dependencies=[Depends(require_analyst)])


WS_SUBPROTOCOL = "cyvantis.bearer"


@app.websocket("/api/v1/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    Authenticated live feed. Preferred: pass the JWT as a subprotocol
    (`new WebSocket(url, ["cyvantis.bearer", token])`) so it never appears in URLs/logs.
    `?token=` is accepted for non-browser clients.
    """
    protocols = [p.strip() for p in websocket.headers.get("sec-websocket-protocol", "").split(",") if p.strip()]
    token = None
    if WS_SUBPROTOCOL in protocols:
        idx = protocols.index(WS_SUBPROTOCOL)
        token = protocols[idx + 1] if idx + 1 < len(protocols) else None
    token = token or websocket.query_params.get("token")

    db = SessionLocal()
    try:
        user = resolve_user_from_token(db, token)
    finally:
        db.close()
    if user is None:
        await websocket.close(code=4401)
        return

    if WS_SUBPROTOCOL in protocols:
        if len(manager.active_connections) >= 200:
            await websocket.close(code=1013)
            return
        await websocket.accept(subprotocol=WS_SUBPROTOCOL)
        manager.active_connections[websocket] = {"username": user.username, "role": user.role}
    elif not await manager.connect(websocket, user):
        return
    client_ip = websocket.client.host if websocket.client else "unknown"
    logger.info("WS connected: user=%s ip=%s", user.username, client_ip)
    try:
        await websocket.send_json({"type": "hello", "data": {"user": user.username, "role": user.role,
                                                             "simulation_mode": settings.SIMULATION_MODE}})
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(websocket)
        logger.info("WS disconnected: user=%s", user.username)


@app.on_event("startup")
async def on_startup():
    logger.info("CYVANTIS backend online - API %s, docs %s/docs", settings.API_V1_STR, settings.API_V1_STR)
    logger.info("Cowrie log path: %s | Synthetic demo telemetry: %s", settings.COWRIE_LOG_PATH,
                "ENABLED (data_origin=simulated)" if settings.SIMULATION_MODE else "disabled")
    if settings.DISABLE_BACKGROUND_TASKS:
        logger.info("Background ingestion disabled (DISABLE_BACKGROUND_TASKS=true)")
        return
    asyncio.create_task(start_cowrie_monitoring())


@app.get("/docs", include_in_schema=False)
def redirect_docs():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{settings.API_V1_STR}/docs")

@app.get("/redoc", include_in_schema=False)
def redirect_redoc():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{settings.API_V1_STR}/redoc")

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs": f"{settings.API_V1_STR}/docs",
        "frontend": "http://localhost:5173"
    }
