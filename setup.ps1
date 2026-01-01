# NoteSmith Setup Script for Windows PowerShell
# Run with: .\setup.ps1

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

Write-Header "NoteSmith Setup 🗒️🔨"

# ============================================
# Check Prerequisites
# ============================================
Write-Header "Checking Prerequisites"

$MissingDeps = @()
$UseUv = $false

# Check Python
if (Test-Command "python") {
    $PythonVersion = & python --version 2>&1
    Write-Success $PythonVersion
} else {
    Write-ErrorMsg "Python not found"
    $MissingDeps += "Python 3.11+"
}

# Check Node.js
if (Test-Command "node") {
    $NodeVersion = & node --version
    Write-Success "Node.js $NodeVersion"
} else {
    Write-ErrorMsg "Node.js not found"
    $MissingDeps += "Node.js 20+"
}

# Check npm
if (Test-Command "npm") {
    $NpmVersion = & npm --version
    Write-Success "npm $NpmVersion"
} else {
    Write-ErrorMsg "npm not found"
    $MissingDeps += "npm"
}

# Check for uv (optional but preferred)
if (Test-Command "uv") {
    $UvVersion = & uv --version 2>&1 | Select-Object -First 1
    Write-Success "uv $UvVersion - will use for Python deps"
    $UseUv = $true
} else {
    Write-WarningMsg "uv not found - will use pip instead"
    Write-Info "Install uv for faster dependency management: https://docs.astral.sh/uv/"
}

# Exit if missing dependencies
if ($MissingDeps.Count -gt 0) {
    Write-Host ""
    Write-ErrorMsg "Missing required dependencies:"
    foreach ($dep in $MissingDeps) {
        Write-Host "  - $dep"
    }
    Write-Host ""
    Write-Host "Please install the missing dependencies and run this script again."
    exit 1
}

# ============================================
# Backend Setup
# ============================================
Write-Header "Setting Up Backend"

Push-Location backend

if ($UseUv) {
    Write-Info "Installing Python dependencies with uv..."
    & uv sync --all-extras
    if ($LASTEXITCODE -ne 0) { throw "uv sync failed" }
    Write-Success "Backend dependencies installed"
} else {
    Write-Info "Creating Python virtual environment..."
    & python -m venv .venv
    
    Write-Info "Activating virtual environment..."
    & .\.venv\Scripts\Activate.ps1
    
    Write-Info "Installing Python dependencies with pip..."
    & python -m pip install --upgrade pip
    & pip install -e ".[dev]"
    if ($LASTEXITCODE -ne 0) { throw "pip install failed" }
    Write-Success "Backend dependencies installed"
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Success "Created backend/.env from template"
        Write-WarningMsg "Please edit backend/.env with your API keys"
    }
} else {
    Write-Info "backend/.env already exists, skipping"
}

Pop-Location

# ============================================
# Frontend Setup
# ============================================
Write-Header "Setting Up Frontend"

Push-Location frontend

Write-Info "Installing Node.js dependencies..."
& npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
Write-Success "Frontend dependencies installed"

# Create .env.local file if it doesn't exist
if (-not (Test-Path ".env.local")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env.local"
        Write-Success "Created frontend/.env.local from template"
        Write-WarningMsg "Please edit frontend/.env.local with your Supabase keys"
    }
} else {
    Write-Info "frontend/.env.local already exists, skipping"
}

Pop-Location

# ============================================
# Summary
# ============================================
Write-Header "Setup Complete! 🎉"

Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. " -ForegroundColor Yellow -NoNewline
Write-Host "Set up Supabase:"
Write-Host "     - Create a project at https://supabase.com"
Write-Host "     - Run migrations from supabase/migrations/"
Write-Host "     - Create a storage bucket named 'recordings'"
Write-Host ""
Write-Host "  2. " -ForegroundColor Yellow -NoNewline
Write-Host "Configure environment variables:"
Write-Host "     - Edit " -NoNewline
Write-Host "backend/.env" -ForegroundColor Cyan -NoNewline
Write-Host " with your API keys"
Write-Host "     - Edit " -NoNewline
Write-Host "frontend/.env.local" -ForegroundColor Cyan -NoNewline
Write-Host " with Supabase keys"
Write-Host ""
Write-Host "  3. " -ForegroundColor Yellow -NoNewline
Write-Host "Start the application:"
Write-Host ""
Write-Host "     Option A: Docker Compose" -ForegroundColor Green
Write-Host "     docker-compose up"
Write-Host ""
Write-Host "     Option B: Manual" -ForegroundColor Green
Write-Host "     # Terminal 1 - Backend"
Write-Host "     cd backend"
if ($UseUv) {
    Write-Host "     uv run uvicorn app.main:app --reload"
} else {
    Write-Host "     .\.venv\Scripts\Activate.ps1"
    Write-Host "     uvicorn app.main:app --reload"
}
Write-Host ""
Write-Host "     # Terminal 2 - Frontend"
Write-Host "     cd frontend"
Write-Host "     npm run dev"
Write-Host ""
Write-Host "  4. " -ForegroundColor Yellow -NoNewline
Write-Host "Open " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Cyan -NoNewline
Write-Host " in your browser"
Write-Host ""

