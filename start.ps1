# NoteSmith Start Script for Windows PowerShell
#
# Usage: .\start.ps1 [options]
#   -Build    Rebuild images before starting
#   -Logs     Follow logs after starting
#   -Help     Show help message

param(
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

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

if ($Help) {
    Write-Host "NoteSmith Start Script" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Usage: .\start.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Build    Rebuild images before starting"
    Write-Host "  -Logs     Follow logs after starting"
    Write-Host "  -Help     Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start.ps1           Start containers"
    Write-Host "  .\start.ps1 -Build    Rebuild and start"
    Write-Host "  .\start.ps1 -Logs     Start and follow logs"
    exit 0
}

Write-Header "NoteSmith Start 🚀"

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

# Build if requested
if ($Build) {
    Write-Info "Building images..."
    Invoke-DockerCompose @("build")
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
    Write-Host "http://localhost:8100" -ForegroundColor Cyan
    Write-Host "  API Docs:  " -NoNewline
    Write-Host "http://localhost:8100/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  View logs: " -NoNewline
    Write-Host "docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "  Stop:      " -NoNewline
    Write-Host ".\stop.ps1" -ForegroundColor Yellow
    Write-Host ""
}
