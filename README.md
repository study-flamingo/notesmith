# NoteSmith 🗒️🔨
*v0.1.0-alpha*

Transform dental appointment recordings into professional clinical notes with AI!

NoteSmith automatically transcribes your appointment recordings and generates structured clinical documentation using customizable templates—saving you hours of administrative work while maintaining HIPAA compliance.

## Features

### 🔒 HIPAA Compliant
Designed with healthcare security requirements in mind:
- Encrypted data storage
- Row-level security policies
- Comprehensive audit logging
- Role-based access control

### 🎙️ Audio Transcription
Upload appointment recordings and receive accurate transcripts powered by OpenAI Whisper. Supports MP3, WAV, M4A, and other common audio formats up to 100MB.

### 🤖 AI-Powered Analysis
Automatically extract clinical information from transcripts:
- Chief complaints
- Procedures performed
- Clinical findings
- Treatment recommendations

### 📝 Template-Based Notes
Generate professional clinical notes using built-in or custom templates:
- **SOAP** - Subjective, Objective, Assessment, Plan
- **DAP** - Data, Assessment, Plan
- **Narrative** - Free-form clinical notes
- **Custom** - Create your own templates

### 📤 Export Options
Export finalized notes in multiple formats:
- PDF for printing and archival
- DOCX for further editing

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 20 or higher
- A Supabase account (free tier works for development)
- An OpenAI API key

### Installation

1. **Clone the repository**

2. **Run the setup script** (recommended)

   On macOS/Linux/Git Bash:

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   On Windows PowerShell:

   ```powershell
   .\setup.ps1
   ```

   This will check prerequisites, install all dependencies, and create config files.

   **Or set up manually:**

   Backend:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -e ".[dev]"
   cp env.example .env
   ```

   Frontend:

   ```bash
   cd frontend
   npm install
   cp env.example .env.local
   ```

3. **Configure Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migrations in `supabase/migrations/` via the SQL editor
   - Create a storage bucket named `recordings`
   - Copy your project URL and keys

5. **Configure environment variables**

   Find your Supabase keys at: **Dashboard → Settings → API**

   Backend (`backend/.env`):

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-secret-key   # "service_role" or "secret" key
   OPENAI_API_KEY=sk-your-openai-key
   SECRET_KEY=generate-a-random-string
   REDIS_URL=redis://localhost:6379/0
   ```

   Frontend (`frontend/.env.local`):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key  # "anon" or "publishable" key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### Running the Application

**Option 1: Docker Compose (Recommended)**

```bash
docker-compose up
```

**Option 2: Manual**

Terminal 1 - Backend:

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

Terminal 2 - Frontend:

```bash
cd frontend
npm run dev
```

Terminal 3 - Redis (required for background jobs):

```bash
docker run -p 6379:6379 redis:7-alpine
```

Terminal 4 - Celery Worker (optional, for async processing):

```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

6. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Your First Note

1. **Sign up** for an account
2. **Create an appointment** from the dashboard
3. **Upload a recording** of your dental appointment
4. **Wait for transcription** (usually under 2 minutes)
5. **Generate a note** by selecting a template
6. **Review and edit** the generated content
7. **Export** to PDF or DOCX

### Managing Templates

Default templates are provided for SOAP, DAP, and Narrative formats. To create custom templates:

1. Go to **Templates** in the sidebar
2. Click **New Template**
3. Use placeholders like `{{ chief_complaint }}`, `{{ procedures }}`, `{{ findings }}`
4. Save and use for future note generation

## LLM Providers

NoteSmith supports multiple AI providers for transcript analysis:

| Provider | Best For | Setup |
|----------|----------|-------|
| OpenAI (default) | Best quality | Set `OPENAI_API_KEY` |
| Anthropic | Alternative cloud | Set `ANTHROPIC_API_KEY` |
| Ollama | Local/private | Run Ollama locally |

Change the default provider with `DEFAULT_LLM_PROVIDER` environment variable.

## API Documentation

When running, visit:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Structure

```
notesmith/
├── backend/          # Python FastAPI server
├── frontend/         # Next.js web application
├── supabase/         # Database migrations
└── docker-compose.yml
```

## HIPAA Compliance Notes

For production healthcare use:

1. **Supabase**: Upgrade to Enterprise plan and execute a BAA
2. **OpenAI**: Contact OpenAI for a BAA covering Whisper and GPT APIs
3. **Hosting**: Deploy on HIPAA-compliant infrastructure
4. **Review**: Conduct a security assessment before handling real PHI

This software is designed to support HIPAA compliance but requires proper configuration and agreements with service providers.

## Support

For issues and feature requests, please open a GitHub issue.

## License

Private - All rights reserved
