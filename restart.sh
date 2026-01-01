#!/usr/bin/env bash
# NoteSmith Restart Script
# Works on macOS, Linux, and Windows (Git Bash/WSL)
#
# Usage: ./restart.sh [options]
#   -f, --flush    Flush application caches (.next, __pycache__) - fixes most issues
#   -c, --clean    Clean restart (remove ALL volumes, rebuild from scratch)
#   -b, --build    Rebuild images before starting
#   -l, --logs     Follow logs after starting
#   -h, --help     Show this help message
#
# Examples:
#   ./restart.sh           Quick restart (stop and start)
#   ./restart.sh -f        Flush caches and restart (recommended for cache issues)
#   ./restart.sh -b        Rebuild and restart
#   ./restart.sh -c        Clean everything and rebuild (nuclear option)
#   ./restart.sh -f -l     Flush caches and follow logs
#
# When to use each option:
#   No flags       - Just need to restart, or hot reload not working
#   -f (--flush)   - 404 errors, stale pages, cache corruption
#   -b (--build)   - Changed package.json, pyproject.toml, or Dockerfile
#   -c (--clean)   - Database issues, major problems (removes all data!)
#   -l (--logs)    - Want to watch logs after restart

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Default options
FLUSH=false
CLEAN=false
BUILD=false
FOLLOW_LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--flush)
            FLUSH=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -l|--logs)
            FOLLOW_LOGS=true
            shift
            ;;
        -h|--help)
            echo "NoteSmith Restart Script"
            echo ""
            echo "Usage: ./restart.sh [options]"
            echo ""
            echo "Options:"
            echo "  -f, --flush    Flush application caches (.next, __pycache__)"
            echo "  -c, --clean    Clean restart (remove ALL volumes, rebuild)"
            echo "  -b, --build    Rebuild images before starting"
            echo "  -l, --logs     Follow logs after starting"
            echo "  -h, --help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./restart.sh           Quick restart (stop and start)"
            echo "  ./restart.sh -f        Flush caches and restart"
            echo "  ./restart.sh -b        Rebuild and restart"
            echo "  ./restart.sh -c        Clean everything and rebuild"
            echo "  ./restart.sh -f -l     Flush caches and follow logs"
            echo ""
            echo "When to use each option:"
            echo "  No flags       Just need to restart, or hot reload not working"
            echo "  -f (--flush)   404 errors, stale pages, cache corruption"
            echo "  -b (--build)   Changed package.json, pyproject.toml, or Dockerfile"
            echo "  -c (--clean)   Database issues, major problems (removes all data!)"
            echo "  -l (--logs)    Want to watch logs after restart"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

print_header "NoteSmith Restart 🔄"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "docker-compose is not installed"
    exit 1
fi

# Use 'docker compose' if available, otherwise 'docker-compose'
if docker compose version &> /dev/null 2>&1; then
    DC="docker compose"
else
    DC="docker-compose"
fi

# Stop containers
print_info "Stopping containers..."
if $CLEAN; then
    $DC down -v --remove-orphans
    print_success "Containers stopped and ALL volumes removed"
else
    $DC down --remove-orphans
    print_success "Containers stopped"
fi

# Flush application caches (but preserve data volumes)
if $FLUSH && ! $CLEAN; then
    print_info "Flushing application caches..."
    
    # Remove .next cache volume
    if docker volume ls -q | grep -q "notesmith_frontend_next"; then
        docker volume rm notesmith_frontend_next 2>/dev/null && \
            print_success "Removed .next cache volume" || \
            print_warning "Could not remove .next cache volume (may not exist)"
    fi
    
    # Remove Python __pycache__ from backend (via mounted volume)
    if [ -d "backend/app" ]; then
        find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find backend -type f -name "*.pyc" -delete 2>/dev/null || true
        print_success "Removed Python cache files"
    fi
    
    # Remove .next from local frontend (if exists outside Docker)
    if [ -d "frontend/.next" ]; then
        rm -rf frontend/.next
        print_success "Removed local .next directory"
    fi
fi

# Build if requested
if $CLEAN || $BUILD; then
    print_info "Building images..."
    if $CLEAN; then
        $DC build --no-cache
    else
        $DC build
    fi
    print_success "Images built"
fi

# Start containers
print_info "Starting containers..."
$DC up -d
print_success "Containers started"

# Wait for services to initialize
print_info "Waiting for services to initialize..."
sleep 5

# Check container status
print_header "Container Status"
$DC ps

# Follow logs if requested
if $FOLLOW_LOGS; then
    echo ""
    print_info "Following logs (Ctrl+C to exit)..."
    $DC logs -f
else
    echo ""
    print_success "NoteSmith is running!"
    echo ""
    echo -e "  Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo -e "  Backend:   ${BLUE}http://localhost:8000${NC}"
    echo -e "  API Docs:  ${BLUE}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo ""
fi
