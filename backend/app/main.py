"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import appointments, notes, recordings, templates, transcripts
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="NoteSmith API",
    description="Dental appointment transcription and clinical notes generation API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["appointments"])
app.include_router(recordings.router, prefix="/api/v1/recordings", tags=["recordings"])
app.include_router(transcripts.router, prefix="/api/v1/transcripts", tags=["transcripts"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["notes"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "NoteSmith API",
        "docs": "/docs",
        "health": "/health",
    }

