#!/usr/bin/env bash
# NoteSmith Stop Script
# Works on macOS, Linux, and Windows (Git Bash/WSL)
#
# Usage: ./stop.sh [options]
#   -v, --volumes  Remove volumes (deletes all data!)
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
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Default options
REMOVE_VOLUMES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -h|--help)
            echo "NoteSmith Stop Script"
            echo ""
            echo "Usage: ./stop.sh [options]"
            echo ""
            echo "Options:"
            echo "  -v, --volumes  Remove volumes (deletes all data!)"
            echo "  -h, --help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./stop.sh           Stop containers"
            echo "  ./stop.sh -v        Stop containers and remove volumes"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

print_header "NoteSmith Stop 🛑"

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
if $REMOVE_VOLUMES; then
    print_warning "This will remove ALL data volumes!"
    $DC down -v --remove-orphans
    print_success "Containers stopped and volumes removed"
else
    $DC down --remove-orphans
    print_success "Containers stopped"
fi

echo ""
print_info "NoteSmith has been stopped"
echo ""
echo -e "  Start again: ${YELLOW}./start.sh${NC}"
echo ""
