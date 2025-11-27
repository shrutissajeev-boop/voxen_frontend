# setup.ps1 - one-command setup for Astro-Auth project (Windows PowerShell)
# - verifies required tools
# - creates missing files and folders with sensible defaults
# - creates Python virtualenv and installs requirements
# - runs npm install for Node components

$ErrorActionPreference = "Continue"
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ROOT_DIR

Write-Host "==> Running setup.ps1 in $ROOT_DIR" -ForegroundColor Green

# Helpers
function CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function CreateFileIfMissing {
    param([string]$FilePath, [string]$Content)
    if (-not (Test-Path $FilePath)) {
        Write-Host "Creating $FilePath" -ForegroundColor Cyan
        Set-Content -Path $FilePath -Value $Content -Encoding UTF8 | Out-Null
    } else {
        Write-Host "Found $FilePath" -ForegroundColor Gray
    }
}

function CreateFolderIfMissing {
    param([string]$FolderPath)
    if (-not (Test-Path $FolderPath -PathType Container)) {
        Write-Host "Creating folder $FolderPath" -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $FolderPath -Force | Out-Null
    } else {
        Write-Host "Found folder $FolderPath" -ForegroundColor Gray
    }
}

# 1) Check basic tools
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow
@("git", "node", "npm", "python", "python3") | ForEach-Object {
    if (CommandExists $_) {
        Write-Host "  - $_`: found" -ForegroundColor Green
    } else {
        Write-Host "  - $_`: NOT FOUND" -ForegroundColor Red
    }
}

# 2) Create folders
Write-Host "`nEnsuring folder structure..." -ForegroundColor Yellow
@("data", "models", "config", "src", "uploads", "uploads\profile-pictures") | ForEach-Object {
    CreateFolderIfMissing $_
}

# 3) Default files
Write-Host "`nEnsuring default files..." -ForegroundColor Yellow

$envContent = @"
PORT=5500
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USER=youruser
DATABASE_PASS=yourpass
DATABASE_NAME=yourdb
SESSION_SECRET=please-change-me
AI_BACKEND_URL=http://127.0.0.1:8000/api/chat
AI_BACKEND_TIMEOUT_MS=300000
"@
CreateFileIfMissing ".env" $envContent

$requirementsContent = @"
fastapi==0.95.0
uvicorn[standard]==0.22.0
python-dotenv==1.0.0
requests==2.31.0
"@
CreateFileIfMissing "requirements.txt" $requirementsContent

$packageJsonContent = @"
{
  "name": "astro-auth",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {}
}
"@
CreateFileIfMissing "package.json" $packageJsonContent

# 4) Python environment
# Detect Python (prefer python3), ensure minimum version, create venv, and install requirements
Write-Host "`nSetting up Python virtual environment..." -ForegroundColor Yellow

$pyBin = $null
$hasGoodPython = $false

if (CommandExists "python3") {
    $pyBin = "python3"
} elseif (CommandExists "python") {
    $pyBin = "python"
}

if ($pyBin) {
    try {
        $pyVersionRaw = & $pyBin --version 2>&1
        Write-Host "Detected Python: $pyBin ($pyVersionRaw)" -ForegroundColor Green
        
        # Extract version numbers
        if ($pyVersionRaw -match "Python (\d+)\.(\d+)") {
            $pyMajor = [int]$matches[1]
            $pyMinor = [int]$matches[2]
            
            # Require Python >= 3.8
            if ($pyMajor -gt 3 -or ($pyMajor -eq 3 -and $pyMinor -ge 8)) {
                $hasGoodPython = $true
            } else {
                Write-Host "Python $pyMajor.$pyMinor is installed but >=3.8 is recommended." -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "Error detecting Python version: $_" -ForegroundColor Red
    }
}

if ($hasGoodPython) {
    # Create venv if missing
    if (-not (Test-Path "venv" -PathType Container)) {
        Write-Host "Creating venv..." -ForegroundColor Cyan
        & $pyBin -m venv venv
        Write-Host "Created venv/" -ForegroundColor Green
    } else {
        Write-Host "Found venv/" -ForegroundColor Gray
    }

    # Determine pip location (Windows uses venv\Scripts\pip.exe)
    $pipBin = if (Test-Path "venv\Scripts\pip.exe") { "venv\Scripts\pip.exe" } else { $null }

    if ($pipBin) {
        Write-Host "Upgrading pip in virtualenv..." -ForegroundColor Cyan
        & $pipBin install --upgrade pip setuptools wheel | Out-Null

        if (Test-Path "requirements.txt") {
            Write-Host "Installing Python dependencies from requirements.txt..." -ForegroundColor Cyan
            & $pipBin install -r requirements.txt | Out-Null
            Write-Host "Dependencies installed." -ForegroundColor Green
        }
    } else {
        Write-Host "Could not find pip in the venv. You can activate the venv manually and run: pip install -r requirements.txt" -ForegroundColor Yellow
    }

    # Usage instructions for activation
    Write-Host "`nTo activate the virtual environment:" -ForegroundColor Yellow
    Write-Host "  PowerShell: .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
    Write-Host "  CMD: venv\Scripts\activate.bat" -ForegroundColor Cyan
} else {
    Write-Host "Python 3.8+ not found. Skipping virtualenv creation. Install Python 3.8+ and re-run setup.ps1 to enable Python environment setup." -ForegroundColor Yellow
}

# 5) Node install
Write-Host "`nInstalling Node dependencies..." -ForegroundColor Yellow
if (CommandExists "npm") {
    Write-Host "Running npm install..." -ForegroundColor Cyan
    npm install | Out-Null
    Write-Host "npm dependencies installed." -ForegroundColor Green
} else {
    Write-Host "npm not found; skipping npm install" -ForegroundColor Yellow
}

# 6) Final notes
Write-Host "`nSetup complete. Next steps:" -ForegroundColor Green
Write-Host "  - Edit .env with your real credentials." -ForegroundColor White
Write-Host "  - If using PostgreSQL, ensure it is running and accessible at DATABASE_HOST:DATABASE_PORT." -ForegroundColor White
Write-Host "  - To run Node server:" -ForegroundColor White
Write-Host "      npm install" -ForegroundColor Cyan
Write-Host "      node server.js" -ForegroundColor Cyan
Write-Host "  - To run Python backend (if present):" -ForegroundColor White
Write-Host "      .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "      pip install -r requirements.txt" -ForegroundColor Cyan
Write-Host "      uvicorn server:app --reload --host 127.0.0.1 --port 8000" -ForegroundColor Cyan

exit 0
