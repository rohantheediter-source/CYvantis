@echo off
setlocal
set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%.venv\Scripts\python.exe" (
    "%SCRIPT_DIR%.venv\Scripts\python.exe" "%SCRIPT_DIR%cyvantis.py" %*
) else if exist "%SCRIPT_DIR%backend\venv\Scripts\python.exe" (
    "%SCRIPT_DIR%backend\venv\Scripts\python.exe" "%SCRIPT_DIR%cyvantis.py" %*
) else (
    python "%SCRIPT_DIR%cyvantis.py" %*
)
