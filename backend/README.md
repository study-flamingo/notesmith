# NoteSmith Backend

FastAPI backend for dental appointment transcription and clinical note generation.

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -e ".[dev]"
```

3. Copy environment configuration:

```bash
cp .env.example .env
```

4. Update `.env` with your credentials.

## Running the Server

Development mode with hot reload:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
pytest
```

With coverage:

```bash
pytest --cov=app --cov-report=html
```

