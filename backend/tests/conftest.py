import os
import sys

# Ensure backend directory is in python sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./test_cyvantis.db"
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-not-for-production-0123456789")
os.environ["DISABLE_BACKGROUND_TASKS"] = "true"
os.environ["INTEL_ENABLE_NETWORK"] = "false"
os.environ["SIMULATION_MODE"] = "false"
os.environ["BOOTSTRAP_ADMIN_PASSWORD"] = "Admin@Cyvantis2026!"
os.environ["BOOTSTRAP_ANALYST_PASSWORD"] = "Analyst@Cyvantis2026!"
os.environ["BOOTSTRAP_VIEWER_PASSWORD"] = "Viewer@Cyvantis2026!"
for _k in ("VIRUSTOTAL_API_KEY", "ABUSEIPDB_API_KEY", "NVD_API_KEY"):
    os.environ.pop(_k, None)
if os.path.exists("./test_cyvantis.db"):
    os.remove("./test_cyvantis.db")

from app.database import Base, get_db, upgrade_schema
from app.main import app
from app.utils.seed_data import seed_database

TEST_DB_URL = "sqlite:///./test_cyvantis.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.drop_all(bind=engine)
    upgrade_schema()
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    if os.path.exists("./test_cyvantis.db"):
        try:
            os.remove("./test_cyvantis.db")
        except Exception:
            pass

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
