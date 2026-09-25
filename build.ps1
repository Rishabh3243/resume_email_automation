# Build script for resume_email_automation (Django)
# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Project Build & Validation" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Determine Python executable
Write-Host "`n[1/4] Checking Python environment..." -ForegroundColor Yellow
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
} else {
    Write-Error "Python was not found in PATH. Please install Python and try again."
    exit 1
}
& $pythonCmd --version

# 2. Check and activate virtual environment if present
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment (venv)..." -ForegroundColor Green
    . .\venv\Scripts\Activate.ps1
} elseif (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment (.venv)..." -ForegroundColor Green
    . .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "No local venv found in ./venv or ./.venv. Using active/system Python." -ForegroundColor DarkYellow
}

# 3. Install / Verify dependencies
Write-Host "`n[2/4] Installing dependencies from requirements.txt..." -ForegroundColor Yellow
& $pythonCmd -m pip install --upgrade pip
& $pythonCmd -m pip install -r requirements.txt

# 4. Django system verification checks
Write-Host "`n[3/4] Running Django system validation..." -ForegroundColor Yellow
& $pythonCmd manage.py check

# 5. Collect static assets into staticfiles/
Write-Host "`n[4/4] Collecting static assets into staticfiles/..." -ForegroundColor Yellow
& $pythonCmd manage.py collectstatic --noinput

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " Build completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
