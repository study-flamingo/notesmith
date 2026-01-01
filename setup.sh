#!/usr/bin/env bash
# NoteSmith Setup Script
# Works on macOS, Linux, and Windows (Git Bash/WSL)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header "NoteSmith Setup 🗒️🔨"

# ============================================
# Check Prerequisites
# ============================================
print_header "Checking Prerequisites"

MISSING_DEPS=()

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    print_success "Python $PYTHON_VERSION"
elif command_exists python; then
    PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2)
    print_success "Python $PYTHON_VERSION"
else
    print_error "Python not found"
    MISSING_DEPS+=("Python 3.11+")
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION"
else
    print_error "Node.js not found"
    MISSING_DEPS+=("Node.js 20+")
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION"
else
    print_error "npm not found"
    MISSING_DEPS+=("npm")
fi

# Check for uv (optional but preferred)
if command_exists uv; then
    UV_VERSION=$(uv --version 2>&1 | head -1)
    print_success "uv $UV_VERSION (will use for Python deps)"
    USE_UV=true
else
    print_warning "uv not found (will use pip instead)"
    print_info "Install uv for faster dependency management: https://docs.astral.sh/uv/"
    USE_UV=false
fi

# Exit if missing dependencies
if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo ""
    print_error "Missing required dependencies:"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  - $dep"
    done
    echo ""
    echo "Please install the missing dependencies and run this script again."
    exit 1
fi

# ============================================
# Backend Setup
# ============================================
print_header "Setting Up Backend"

cd backend

# Create virtual environment and install dependencies
if [ "$USE_UV" = true ]; then
    print_info "Installing Python dependencies with uv..."
    uv sync --all-extras
    print_success "Backend dependencies installed"
else
    print_info "Creating Python virtual environment..."
    python3 -m venv .venv || python -m venv .venv
    
    # Activate venv
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        source .venv/Scripts/activate
    else
        source .venv/bin/activate
    fi
    
    print_info "Installing Python dependencies with pip..."
    pip install --upgrade pip
    pip install -e ".[dev]"
    print_success "Backend dependencies installed"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        print_success "Created backend/.env from template"
        print_warning "Please edit backend/.env with your API keys"
    fi
else
    print_info "backend/.env already exists, skipping"
fi

cd ..

# ============================================
# Frontend Setup
# ============================================
print_header "Setting Up Frontend"

cd frontend

print_info "Installing Node.js dependencies..."
npm install
print_success "Frontend dependencies installed"

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    if [ -f env.example ]; then
        cp env.example .env.local
        print_success "Created frontend/.env.local from template"
        print_warning "Please edit frontend/.env.local with your Supabase keys"
    fi
else
    print_info "frontend/.env.local already exists, skipping"
fi

cd ..

# ============================================
# Summary
# ============================================
print_header "Setup Complete! 🎉"

echo -e "Next steps:\n"
echo -e "  ${YELLOW}1.${NC} Set up Supabase:"
echo "     - Create a project at https://supabase.com"
echo "     - Run migrations from supabase/migrations/"
echo "     - Create a storage bucket named 'recordings'"
echo ""
echo -e "  ${YELLOW}2.${NC} Configure environment variables:"
echo "     - Edit ${BLUE}backend/.env${NC} with your API keys"
echo "     - Edit ${BLUE}frontend/.env.local${NC} with Supabase keys"
echo ""
echo -e "  ${YELLOW}3.${NC} Start the application:"
echo ""
echo "     ${GREEN}Option A: Docker Compose${NC}"
echo "     docker-compose up"
echo ""
echo "     ${GREEN}Option B: Manual${NC}"
echo "     # Terminal 1 - Backend"
echo "     cd backend"
if [ "$USE_UV" = true ]; then
echo "     uv run uvicorn app.main:app --reload"
else
echo "     source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows"
echo "     uvicorn app.main:app --reload"
fi
echo ""
echo "     # Terminal 2 - Frontend"
echo "     cd frontend"
echo "     npm run dev"
echo ""
echo -e "  ${YELLOW}4.${NC} Open ${BLUE}http://localhost:3000${NC} in your browser"
echo ""

