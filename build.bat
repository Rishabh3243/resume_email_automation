@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo  Starting Project Build ^& Validation
echo ==========================================

REM 1. Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python was not found in PATH.
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

REM 2. Activate virtualenv if present
if exist venv\Scripts\activate.bat (
    echo Activating venv...
    call venv\Scripts\activate.bat
) else if exist .venv\Scripts\activate.bat (
    echo Activating .venv...
    call .venv\Scripts\activate.bat
)

REM 3. Install requirements
echo.
echo [1/3] Installing dependencies from requirements.txt...
%PYTHON_CMD% -m pip install --upgrade pip
%PYTHON_CMD% -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed.
    exit /b %errorlevel%
)

REM 4. Django system check
echo.
echo [2/3] Checking Django configuration...
%PYTHON_CMD% manage.py check
if %errorlevel% neq 0 (
    echo [ERROR] Django check failed.
    exit /b %errorlevel%
)

REM 5. Collect static assets
echo.
echo [3/3] Collecting static files into staticfiles/...
%PYTHON_CMD% manage.py collectstatic --noinput
if %errorlevel% neq 0 (
    echo [ERROR] Collectstatic failed.
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo  Build completed successfully!
echo ==========================================
