# NoteSmith - Development Documentation

## Project Overview

NoteSmith is a HIPAA-compliant web application that processes passively-recorded dental appointments to automatically generate clinical notes. The system transcribes audio recordings, analyzes the content using AI, and produces structured clinical documentation based on customizable templates.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Auth    │  │  Upload  │  │ Templates│  │ Notes Viewer     │ │
│  │  Pages   │  │  Zone    │  │  Editor  │  │ + Export         │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   API    │  │Transcrip-│  │  LLM     │  │ Template Engine  │ │
│  │ Endpoints│  │  tion    │  │ Service  │  │ + Note Generator │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌───────────┐
│   Supabase   │ │  Whisper │ │ LLM Provider│ │   Redis   │
│  (DB/Auth/   │ │   API    │ │  (OpenAI/   │ │ (Celery)  │
│   Storage)   │ │          │ │  Anthropic) │ │           │
└──────────────┘ └──────────┘ └─────────────┘ └───────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS | UI, SSR, routing |
| Backend | Python 3.11+, FastAPI | REST API, business logic |
| Database | Supabase (PostgreSQL) | Data persistence, RLS |
| Auth | Supabase Auth | User management, sessions |
| Storage | Supabase Storage | Audio files |
| Transcription | OpenAI Whisper API | Speech-to-text |
| LLM | OpenAI, Anthropic, Ollama (pluggable) | Analysis, note generation |
| Queue | Celery + Redis | Background jobs |

## Authentication Architecture

NoteSmith uses Supabase Auth with a two-table user model:

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Signs Up                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  auth.users (Supabase managed)                                  │
│  - Email, password hash, sessions                               │
│  - Handles login/logout, password reset                         │
│  - Provides auth.uid() for RLS policies                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Trigger: on_auth_user_created
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  public.users (Application managed)                             │
│  - role (admin, dentist, hygienist, assistant, staff)           │
│  - practice_id (which dental practice they belong to)           │
│  - full_name, is_active                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- App users are stored in `auth.users`, NOT as Supabase project admins
- A database trigger automatically creates `public.users` records on signup
- Row-Level Security (RLS) uses `auth.uid()` to filter data by user/practice
- The `service_role` key (server-side only) bypasses RLS for admin operations

## Database Migrations

| Migration | Purpose |
|-----------|---------|
| `001_initial_schema.sql` | Tables, enums, indexes, default templates |
| `002_rls_policies.sql` | Row-Level Security for HIPAA compliance |
| `003_user_creation_trigger.sql` | Auto-create `public.users` on signup |

## Project Structure

```
notesmith/
├── backend/
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   ├── cli/            # CLI commands (typer)
│   │   │   └── commands/   # Individual command modules
│   │   ├── core/           # Config, security, logging
│   │   ├── db/             # Supabase client
│   │   ├── models/         # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   └── llm/        # Pluggable LLM providers
│   │   └── workers/        # Celery tasks
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Login, register
│   │   └── (dashboard)/    # Protected routes
│   ├── components/
│   ├── lib/                # Supabase, API client
│   └── package.json
├── extension/              # Chrome extension (WXT)
│   ├── entrypoints/        # popup, background, content
│   ├── components/         # React components
│   └── lib/                # API client, storage
├── supabase/
│   └── migrations/         # SQL schema files
├── docker-compose.yml
├── setup.sh                # Unix/Mac setup script
├── setup.ps1               # Windows setup script
└── README.md
```

## Environment Setup

### Backend (`backend/.env`)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-key      # "service_role" or "secret" in dashboard
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-key              # Optional
DEFAULT_LLM_PROVIDER=openai
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=generate-with-openssl-rand-hex-32
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key  # "anon" or "publishable" in dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development Commands

```bash
# Quick setup (run from project root)
./setup.sh          # Mac/Linux/Git Bash
.\setup.ps1         # Windows PowerShell

# Start all services
docker-compose up

# Restart with cache flush (fixes 404s, stale pages)
./restart.sh -f     # Mac/Linux/Git Bash
.\restart.ps1 -Flush # Windows PowerShell

# Individual services
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
cd backend && celery -A app.workers.celery_app worker --loglevel=info
```

## Frontend Styling

Color palette: ARC-esque
1. BG: #15101a
2. Text: #eeeeee
3. Accents: #f80909, #f7cb09, #2ef38a, #84f3ec
4. Muted: #999999
5. Dim: #666666

## Implementation Status

### Completed ✅

- [x] Project scaffolding and Docker configuration
- [x] Database schema with all tables and relationships
- [x] Row-Level Security policies
- [x] Supabase Auth integration with user creation trigger
- [x] Registration flow with email confirmation UI
- [x] Audio upload with drag-and-drop UI
- [x] OpenAI Whisper transcription service
- [x] Pluggable LLM interface (OpenAI, Anthropic, Ollama)
- [x] Template management (CRUD, default templates)
- [x] Clinical note generation pipeline
- [x] PDF and DOCX export
- [x] Audit logging infrastructure
- [x] Dashboard with statistics
- [x] Templates module frontend (list, view, edit, create)
- [x] Template editor with syntax highlighting
- [x] Template import/export (JSON format)

### Remaining Work

**Phase 3 - Polish and Compliance:**
- [ ] Implement automatic session timeout
- [ ] Add template conditionals and loops
- [ ] Batch processing UI for multiple recordings
- [ ] Analytics and reporting dashboard

**Phase 4 - Advanced Features:**
- [ ] Real-time streaming transcription
- [ ] Practice management system integrations
- [ ] Mobile-responsive PWA enhancements
- [ ] Multi-language support
- [ ] Speaker diarization improvements

**Chrome Extension:**
- [x] WXT scaffold with React popup
- [x] Content script for field insertion
- [ ] Connect to real API endpoints
- [ ] Authentication flow (web app → extension)
- [ ] Chrome Web Store submission

**CLI Tool:**
- [x] CLI scaffold with typer (commands stubbed)
- [ ] Core commands (transcribe, generate, export, process)
- [ ] Template management commands
- [ ] Configuration system
- [ ] Python API for programmatic use

## ⚠️ Pre-Production Checklist

Before deploying to production, ensure:

- [ ] **Email confirmation enabled** 
  - Supabase Dashboard → Authentication → Providers → Email → "Confirm email"
  - Currently DISABLED for development convenience
  
- [ ] **HIPAA compliance items**
  - [ ] Supabase Enterprise BAA signed
  - [ ] OpenAI BAA for Whisper and GPT
  - [ ] Session timeout implementation
  - [ ] Data retention policy automation

---

## Scratchpad

### Restart Scripts - Cache Flushing (Dec 2024)

Added `-f/--flush` flag to `restart.sh` and `restart.ps1`:
- Clears `.next` cache volume (fixes 404 errors on pages)
- Removes `__pycache__` files (fixes stale Python code)
- Less aggressive than `--clean` (preserves database volumes)

Usage: `./restart.sh -f` or `.\restart.ps1 -Flush`

### Supabase Auth - JWKS Verification (Dec 2024)

Backend now uses **JWKS-based JWT verification** instead of shared secrets:
- Supabase uses ES256 (P-256 elliptic curve) signing keys
- Public keys fetched from `/.well-known/jwks.json` endpoint
- 10-minute cache for performance
- No `SUPABASE_JWT_SECRET` env var needed anymore

See `backend/app/core/security.py` for implementation.

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 404 on pages that exist | `./restart.sh -f` to flush caches |
| "Invalid or expired token" | Check backend logs, verify JWKS endpoint reachable |
| CORS errors | Ensure no rogue process on port 8000, check `cors_origins` in config |
| Stale Python code | `./restart.sh -f` or manually delete `__pycache__` |

### Next Up

**Chrome Extension:**
- Implement `/notes/pending` and `/notes/{id}/mark-inserted` endpoints
- Add `/auth/extension` callback page
- See `docs/EXTENSION.md` for design

**CLI Tool:**
- Wire commands to services (transcribe, generate, export)
- Implement config file (`~/.notesmith/config.toml`)
