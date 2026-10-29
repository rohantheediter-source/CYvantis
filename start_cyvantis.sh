#!/usr/bin/env bash
# CYVANTIS Kali Linux / Linux Web Dashboard Launcher

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================"
echo "  CYVANTIS Enterprise Gateway & Security Nexus (Linux)"
echo "========================================================"

# Setup Python virtual environment if not present
if [ ! -d "$SCRIPT_DIR/backend/venv" ]; then
    echo "[+] Initializing Python virtual environment..."
    python3 -m venv "$SCRIPT_DIR/backend/venv"
    "$SCRIPT_DIR/backend/venv/bin/pip" install -r "$SCRIPT_DIR/backend/requirements.txt"
fi

# Install frontend dependencies if not present
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "[+] Installing frontend dependencies..."
    (cd "$SCRIPT_DIR/frontend" && npm install)
fi

echo "[1/3] Launching FastAPI Backend Server (Port 8000)..."
(cd "$SCRIPT_DIR/backend" && "$SCRIPT_DIR/backend/venv/bin/python" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &

echo "[2/3] Launching React Frontend Server (Port 5173)..."
(cd "$SCRIPT_DIR/frontend" && npm run dev) &

sleep 3
echo "[3/3] Opening Web Dashboard in Browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173 &> /dev/null &
elif command -v sensible-browser &> /dev/null; then
    sensible-browser http://localhost:5173 &> /dev/null &
fi

echo ""
echo "========================================================"
echo "  [+] CYVANTIS Platform Active on Kali Linux!"
echo "  [+] Frontend Website: http://localhost:5173"
echo "  [+] Backend API Docs: http://localhost:8000/api/v1/docs"
echo "========================================================"

wait
