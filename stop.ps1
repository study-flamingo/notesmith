# NoteSmith Stop Script for Windows PowerShell
#
# Usage: .\stop.ps1 [options]
#   -Volumes  Remove volumes (deletes all data!)
#   -Help     Show help message

param(
    [switch]$Volumes,
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
    Write-Host "NoteSmith Stop Script" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Usage: .\stop.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Volumes  Remove volumes (deletes all data!)"
    Write-Host "  -Help     Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\stop.ps1           Stop containers"
    Write-Host "  .\stop.ps1 -Volumes  Stop containers and remove volumes"
    exit 0
}

Write-Header "NoteSmith Stop 🛑"

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
if ($Volumes) {
    Write-WarningMsg "This will remove ALL data volumes!"
    Invoke-DockerCompose @("down", "-v", "--remove-orphans")
    Write-Success "Containers stopped and volumes removed"
} else {
    Invoke-DockerCompose @("down", "--remove-orphans")
    Write-Success "Containers stopped"
}

Write-Host ""
Write-Info "NoteSmith has been stopped"
Write-Host ""
Write-Host "  Start again: " -NoNewline
Write-Host ".\start.ps1" -ForegroundColor Yellow
Write-Host ""
