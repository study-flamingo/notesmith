# NoteSmith Test Runner
# Usage: .\test.ps1 [frontend|backend|all] [-Coverage] [-Watch] [-ShowCommands]

param(
    [Parameter(Position=0)]
    [ValidateSet("frontend", "backend", "all", "fe", "be")]
    [string]$Target = "all",
    
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$ShowCommands
)

$ProjectRoot = $PSScriptRoot

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }

# Normalize target
$Target = switch ($Target) {
    "fe" { "frontend" }
    "be" { "backend" }
    default { $Target }
}

Write-Info "=========================================="
Write-Info "  NoteSmith Test Runner"
Write-Info "=========================================="
Write-Host ""

$script:FrontendResult = $null
$script:BackendResult = $null

# Run Frontend Tests
function Run-FrontendTests {
    Write-Info "[Frontend] Running tests..."
    Push-Location "$ProjectRoot\frontend"
    
    try {
        if ($Watch) {
            $script = "test"
        } elseif ($Coverage) {
            $script = "test:coverage"
        } else {
            $script = "test:run"
        }
        
        if ($ShowCommands) {
            Write-Host "  Command: npm run $script"
        }
        
        npm run $script 2>&1 | ForEach-Object { Write-Host $_ }
        $script:FrontendResult = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
}

# Run Backend Tests
function Run-BackendTests {
    Write-Info "[Backend] Running tests..."
    Push-Location "$ProjectRoot\backend"
    
    try {
        $pytest = ".\.venv\Scripts\pytest.exe"
        if (-not (Test-Path $pytest)) {
            Write-Err "Backend virtual environment not found. Run setup.ps1 first."
            $script:BackendResult = 1
            return
        }
        
        $pytestArgs = @("tests/", "-v")
        
        if ($Coverage) {
            $pytestArgs += "--cov=app"
            $pytestArgs += "--cov-report=term-missing"
        }
        
        if ($ShowCommands) {
            Write-Host "  Command: $pytest $($pytestArgs -join ' ')"
        }
        
        & $pytest @pytestArgs 2>&1 | ForEach-Object { Write-Host $_ }
        $script:BackendResult = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
}

# Execute based on target
if ($Target -eq "frontend" -or $Target -eq "all") {
    Run-FrontendTests
}

if ($Target -eq "backend" -or $Target -eq "all") {
    # Don't run backend if watch mode (frontend watch is blocking)
    if ($Watch -and $Target -eq "all") {
        Write-Warn "[Backend] Skipping - watch mode only supports single target"
    } else {
        Run-BackendTests
    }
}

# Summary
Write-Host ""
Write-Info "=========================================="
Write-Info "  Test Results Summary"
Write-Info "=========================================="

$exitCode = 0

if ($null -ne $script:FrontendResult) {
    if ($script:FrontendResult -eq 0) {
        Write-Success "  Frontend: PASSED"
    } else {
        Write-Err "  Frontend: FAILED (exit code: $($script:FrontendResult))"
        $exitCode = 1
    }
}

if ($null -ne $script:BackendResult) {
    if ($script:BackendResult -eq 0) {
        Write-Success "  Backend:  PASSED"
    } else {
        Write-Err "  Backend:  FAILED (exit code: $($script:BackendResult))"
        $exitCode = 1
    }
}

Write-Host ""

if ($exitCode -eq 0) {
    Write-Success "All tests passed!"
} else {
    Write-Err "Some tests failed."
}

exit $exitCode
