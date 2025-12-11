# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and UV in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && curl -LsSf https://astral.sh/uv/install.sh | sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Add UV to PATH
ENV PATH="/root/.local/bin:$PATH"

# Configure UV for faster installs
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy dependency specification and required files for build
COPY pyproject.toml README.md ./

# Create minimal package structure for initial dependency install
RUN mkdir -p app && echo '__version__ = "0.1.0"' > app/__init__.py

# Install dependencies with UV (much faster than pip)
# Uses BuildKit cache mount to persist UV cache between builds
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -e .

# Copy application code (this layer changes most often)
COPY . .

# Expose port
EXPOSE 8000

# Default command (overridden in docker-compose for dev)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
