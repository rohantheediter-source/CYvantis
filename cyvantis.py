#!/usr/bin/env python3
import sys
import os
import subprocess

# Auto-detect project virtual environment
root_dir = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.realpath(os.path.join(root_dir, ".venv", "Scripts", "python.exe"))
if not os.path.exists(venv_python):
    venv_python = os.path.realpath(os.path.join(root_dir, "backend", "venv", "Scripts", "python.exe"))
if not os.path.exists(venv_python):
    venv_python = os.path.realpath(os.path.join(root_dir, ".venv", "bin", "python"))
if not os.path.exists(venv_python):
    venv_python = os.path.realpath(os.path.join(root_dir, "backend", "venv", "bin", "python"))

# If running under global/system python instead of project venv, re-execute with venv python
if os.path.exists(venv_python) and os.path.realpath(sys.executable).lower() != venv_python.lower():
    cmd = [venv_python, os.path.abspath(__file__)] + sys.argv[1:]
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(root_dir, "backend"))

from app.cli import main

if __name__ == "__main__":
    main()
