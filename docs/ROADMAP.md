# NoteSmith Roadmap

## ✅ Phase 1: Foundation (Complete)

- [x] Project scaffolding (Next.js 15 + FastAPI)
- [x] Database schema and migrations
- [x] Supabase Auth with user creation trigger
- [x] Row-Level Security policies
- [x] Docker Compose configuration
- [x] Landing page and auth UI (login/register)

## 🔄 Phase 2: Core Features (In Progress)

### Backend Services ✅
- [x] OpenAI Whisper transcription service
- [x] Pluggable LLM providers (OpenAI, Anthropic, Ollama)
- [x] Template engine (Jinja2)
- [x] Note generation pipeline
- [x] PDF and DOCX export service
- [x] Audit logging

### Frontend Modules

| Module | Status | Notes |
|--------|--------|-------|
| Dashboard | 🟡 Partial | UI works, needs real data |
| Templates | ✅ Complete | List, view, edit, create, import/export |
| Appointments | 🔴 TODO | List, create, edit, delete |
| Recordings | 🔴 TODO | Upload, playback, status |
| Notes | 🔴 TODO | View, edit, export |
| Settings | 🔴 TODO | User profile, practice settings |

### API Integration
- [ ] Connect frontend to FastAPI backend
- [ ] Implement authentication flow (JWT from Supabase → backend)
- [ ] Wire up all CRUD operations

## 📋 Phase 3: Polish & Compliance

- [ ] Automatic session timeout
- [ ] Template conditionals and loops
- [ ] Batch processing for multiple recordings
- [ ] Analytics dashboard
- [ ] HIPAA compliance (BAAs, data retention)

## 📋 Phase 4: Advanced Features

- [ ] Real-time streaming transcription
- [ ] Practice management integrations
- [ ] Mobile-responsive PWA
- [ ] Multi-language support

## 🔌 Chrome Extension

- [x] WXT scaffold with React popup
- [x] Content script for field insertion
- [ ] Connect to real API endpoints
- [ ] Authentication flow
- [ ] Chrome Web Store submission

## 🚀 Pre-Launch Checklist

- [ ] Enable email confirmation in Supabase
- [ ] Production environment setup
- [ ] Security audit
- [ ] Load testing

---

*Last updated: December 2024*
