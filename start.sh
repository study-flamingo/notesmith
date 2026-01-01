#!/usr/bin/env bash
# NoteSmith Start Script
# Works on macOS, Linux, and Windows (Git Bash/WSL)
#
# Usage: ./start.sh [options]
#   -b, --build    Rebuild images before starting
#   -l, --logs     Follow logs after starting
#   -h, --help     Show this help message

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
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Default options
BUILD=false
FOLLOW_LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--build)
            BUILD=true
            shift
            ;;
        -l|--logs)
            FOLLOW_LOGS=true
            shift
            ;;
        -h|--help)
            echo "NoteSmith Start Script"
            echo ""
            echo "Usage: ./start.sh [options]"
            echo ""
            echo "Options:"
            echo "  -b, --build    Rebuild images before starting"
            echo "  -l, --logs     Follow logs after starting"
            echo "  -h, --help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./start.sh           Start containers"
            echo "  ./start.sh -b        Rebuild and start"
            echo "  ./start.sh -l        Start and follow logs"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

print_header "NoteSmith Start 🚀"

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

# Build if requested
if $BUILD; then
    print_info "Building images..."
    $DC build
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
    echo -e "  Backend:   ${BLUE}http://localhost:8100${NC}"
    echo -e "  API Docs:  ${BLUE}http://localhost:8100/docs${NC}"
    echo ""
    echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Stop:      ${YELLOW}./stop.sh${NC}"
    echo ""
fi
