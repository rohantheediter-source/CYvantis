#!/usr/bin/env bash
# CYVANTIS Kali Linux / Linux CLI Tool Wrapper

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "$SCRIPT_DIR/.venv/bin/python" ]; then
    "$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/cyvantis.py" "$@"
elif [ -f "$SCRIPT_DIR/backend/venv/bin/python" ]; then
    "$SCRIPT_DIR/backend/venv/bin/python" "$SCRIPT_DIR/cyvantis.py" "$@"
else
    python3 "$SCRIPT_DIR/cyvantis.py" "$@"
fi
