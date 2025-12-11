#!/usr/bin/env bash
# NoteSmith Restart Script
# Works on macOS, Linux, and Windows (Git Bash/WSL)
#
# Usage: ./restart.sh [options]
#   -c, --clean    Clean restart (remove volumes, rebuild from scratch)
#   -b, --build    Rebuild images before starting
#   -l, --logs     Follow logs after starting
#   -h, --help     Show this help message
#
# Examples:
#   ./restart.sh           Quick restart (stop and start)
#   ./restart.sh -b        Rebuild and restart
#   ./restart.sh -c        Clean everything and rebuild
#   ./restart.sh -b -l     Rebuild and follow logs
#
# When to use each option:
#   No flags       - Just need to restart, or hot reload not working
#   -b (--build)   - Changed package.json, pyproject.toml, or Dockerfile
#   -c (--clean)   - JSON manifest error, cache corruption, or major issues
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
CLEAN=false
BUILD=false
FOLLOW_LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
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
            echo "  -c, --clean    Clean restart (remove volumes, rebuild from scratch)"
            echo "  -b, --build    Rebuild images before starting"
            echo "  -l, --logs     Follow logs after starting"
            echo "  -h, --help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./restart.sh           Quick restart (stop and start)"
            echo "  ./restart.sh -b        Rebuild and restart"
            echo "  ./restart.sh -c        Clean everything and rebuild"
            echo "  ./restart.sh -b -l     Rebuild and follow logs"
            echo ""
            echo "When to use each option:"
            echo "  No flags       Just need to restart, or hot reload not working"
            echo "  -b (--build)   Changed package.json, pyproject.toml, or Dockerfile"
            echo "  -c (--clean)   JSON manifest error, cache corruption, or major issues"
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
    print_success "Containers stopped and volumes removed"
else
    $DC down --remove-orphans
    print_success "Containers stopped"
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

# Wait a moment for services to initialize
sleep 2

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

