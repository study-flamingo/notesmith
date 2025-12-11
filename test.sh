#!/usr/bin/env bash
# NoteSmith Test Runner
# Usage: ./test.sh [frontend|backend|all] [--coverage] [--watch] [--verbose]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-all}"
COVERAGE=false
WATCH=false
VERBOSE=false

# Parse arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage|-c) COVERAGE=true ;;
        --watch|-w) WATCH=true ;;
        --verbose|-v) VERBOSE=true ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

# Normalize target
case $TARGET in
    fe) TARGET="frontend" ;;
    be) TARGET="backend" ;;
esac

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() { echo -e "${CYAN}$1${NC}"; }
success() { echo -e "${GREEN}$1${NC}"; }
warn() { echo -e "${YELLOW}$1${NC}"; }
error() { echo -e "${RED}$1${NC}"; }

info "=========================================="
info "  NoteSmith Test Runner"
info "=========================================="
echo ""

FRONTEND_RESULT=""
BACKEND_RESULT=""

# Run Frontend Tests
run_frontend_tests() {
    info "[Frontend] Running tests..."
    cd "$PROJECT_ROOT/frontend"
    
    local cmd="npm"
    local args=""
    
    if [ "$WATCH" = true ]; then
        args="run test"
    elif [ "$COVERAGE" = true ]; then
        args="run test:coverage"
    else
        args="run test:run"
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo "  Command: $cmd $args"
    fi
    
    if $cmd $args; then
        FRONTEND_RESULT=0
    else
        FRONTEND_RESULT=$?
    fi
}

# Run Backend Tests
run_backend_tests() {
    info "[Backend] Running tests..."
    cd "$PROJECT_ROOT/backend"
    
    # Detect OS and set pytest path
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        PYTEST=".venv/Scripts/pytest.exe"
    else
        PYTEST=".venv/bin/pytest"
    fi
    
    if [ ! -f "$PYTEST" ]; then
        error "Backend virtual environment not found. Run setup script first."
        BACKEND_RESULT=1
        return
    fi
    
    local args="tests/ -v"
    
    if [ "$COVERAGE" = true ]; then
        args="$args --cov=app --cov-report=term-missing"
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo "  Command: $PYTEST $args"
    fi
    
    if $PYTEST $args; then
        BACKEND_RESULT=0
    else
        BACKEND_RESULT=$?
    fi
}

# Execute based on target
if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "all" ]; then
    run_frontend_tests
    cd "$PROJECT_ROOT"
fi

if [ "$TARGET" = "backend" ] || [ "$TARGET" = "all" ]; then
    # Don't run backend if watch mode (frontend watch is blocking)
    if [ "$WATCH" = true ] && [ "$TARGET" = "all" ]; then
        warn "[Backend] Skipping - watch mode only supports single target"
    else
        run_backend_tests
        cd "$PROJECT_ROOT"
    fi
fi

# Summary
echo ""
info "=========================================="
info "  Test Results Summary"
info "=========================================="

EXIT_CODE=0

if [ -n "$FRONTEND_RESULT" ]; then
    if [ "$FRONTEND_RESULT" -eq 0 ]; then
        success "  Frontend: PASSED"
    else
        error "  Frontend: FAILED (exit code: $FRONTEND_RESULT)"
        EXIT_CODE=1
    fi
fi

if [ -n "$BACKEND_RESULT" ]; then
    if [ "$BACKEND_RESULT" -eq 0 ]; then
        success "  Backend:  PASSED"
    else
        error "  Backend:  FAILED (exit code: $BACKEND_RESULT)"
        EXIT_CODE=1
    fi
fi

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    success "All tests passed!"
else
    error "Some tests failed."
fi

exit $EXIT_CODE

