# NoteSmith Restart Script for Windows PowerShell
#
# Usage: .\restart.ps1 [options]
#   -Flush    Flush application caches (.next, __pycache__) - fixes most issues
#   -Clean    Clean restart (remove ALL volumes, rebuild from scratch)
#   -Build    Rebuild images before starting
#   -Logs     Follow logs after starting
#   -Help     Show help message
#
# Examples:
#   .\restart.ps1              Quick restart (stop and start)
#   .\restart.ps1 -Flush       Flush caches and restart (recommended for cache issues)
#   .\restart.ps1 -Build       Rebuild and restart
#   .\restart.ps1 -Clean       Clean everything and rebuild (nuclear option)
#   .\restart.ps1 -Flush -Logs Flush caches and follow logs
#
# When to use each option:
#   No flags   - Just need to restart, or hot reload not working
#   -Flush     - 404 errors, stale pages, cache corruption
#   -Build     - Changed package.json, pyproject.toml, or Dockerfile
#   -Clean     - Database issues, major problems (removes all data!)
#   -Logs      - Want to watch logs after restart

param(
    [switch]$Flush,
    [switch]$Clean,
    [switch]$Build,
    [switch]$Logs,
    [switch]$Help
)

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

if ($Help) {
    Write-Host "NoteSmith Restart Script" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Usage: .\restart.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Flush    Flush application caches (.next, __pycache__)"
    Write-Host "  -Clean    Clean restart (remove ALL volumes, rebuild)"
    Write-Host "  -Build    Rebuild images before starting"
    Write-Host "  -Logs     Follow logs after starting"
    Write-Host "  -Help     Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\restart.ps1              Quick restart (stop and start)"
    Write-Host "  .\restart.ps1 -Flush       Flush caches and restart"
    Write-Host "  .\restart.ps1 -Build       Rebuild and restart"
    Write-Host "  .\restart.ps1 -Clean       Clean everything and rebuild"
    Write-Host "  .\restart.ps1 -Flush -Logs Flush caches and follow logs"
    Write-Host ""
    Write-Host "When to use each option:" -ForegroundColor Yellow
    Write-Host "  No flags   Just need to restart, or hot reload not working"
    Write-Host "  -Flush     404 errors, stale pages, cache corruption"
    Write-Host "  -Build     Changed package.json, pyproject.toml, or Dockerfile"
    Write-Host "  -Clean     Database issues, major problems (removes all data!)"
    Write-Host "  -Logs      Want to watch logs after restart"
    exit 0
}

Write-Header "NoteSmith Restart 🔄"

# Check if docker-compose is available
$useDockerCompose = $false
try {
    $null = & docker compose version 2>&1
    $useDockerCompose = $true
} catch {
    try {
        $null = Get-Command docker-compose -ErrorAction Stop
    } catch {
        Write-ErrorMsg "docker-compose is not installed"
        exit 1
    }
}

function Invoke-DockerCompose {
    param([string[]]$Arguments)
    if ($useDockerCompose) {
        & docker compose @Arguments
    } else {
        & docker-compose @Arguments
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed"
    }
}

# Stop containers
Write-Info "Stopping containers..."
if ($Clean) {
    Invoke-DockerCompose @("down", "-v", "--remove-orphans")
    Write-Success "Containers stopped and ALL volumes removed"
} else {
    Invoke-DockerCompose @("down", "--remove-orphans")
    Write-Success "Containers stopped"
}

# Flush application caches (but preserve data volumes)
if ($Flush -and -not $Clean) {
    Write-Info "Flushing application caches..."
    
    # Remove .next cache volume
    $volumes = docker volume ls -q 2>$null
    if ($volumes -contains "notesmith_frontend_next") {
        try {
            docker volume rm notesmith_frontend_next 2>$null
            Write-Success "Removed .next cache volume"
        } catch {
            Write-WarningMsg "Could not remove .next cache volume (may not exist)"
        }
    }
    
    # Remove Python __pycache__ from backend
    if (Test-Path "backend\app") {
        Get-ChildItem -Path "backend" -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | 
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path "backend" -Recurse -File -Filter "*.pyc" -ErrorAction SilentlyContinue | 
            Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Success "Removed Python cache files"
    }
    
    # Remove .next from local frontend (if exists outside Docker)
    if (Test-Path "frontend\.next") {
        Remove-Item -Path "frontend\.next" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Removed local .next directory"
    }
}

# Build if requested
if ($Clean -or $Build) {
    Write-Info "Building images..."
    if ($Clean) {
        Invoke-DockerCompose @("build", "--no-cache")
    } else {
        Invoke-DockerCompose @("build")
    }
    Write-Success "Images built"
}

# Start containers
Write-Info "Starting containers..."
Invoke-DockerCompose @("up", "-d")
Write-Success "Containers started"

# Wait for services to initialize
Write-Info "Waiting for services to initialize..."
Start-Sleep -Seconds 5

# Check container status
Write-Header "Container Status"
Invoke-DockerCompose @("ps")

# Follow logs if requested
if ($Logs) {
    Write-Host ""
    Write-Info "Following logs (Ctrl+C to exit)..."
    Invoke-DockerCompose @("logs", "-f")
} else {
    Write-Host ""
    Write-Success "NoteSmith is running!"
    Write-Host ""
    Write-Host "  Frontend:  " -NoNewline
    Write-Host "http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend:   " -NoNewline
    Write-Host "http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  API Docs:  " -NoNewline
    Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  View logs: " -NoNewline
    Write-Host "docker-compose logs -f" -ForegroundColor Yellow
    Write-Host ""
}
