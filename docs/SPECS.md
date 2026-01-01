# NoteSmith Technical Specifications

## System Requirements

### Performance
- Audio file upload: Up to 100MB
- Transcription: < 2 minutes for 30-minute recording
- Note generation: < 30 seconds

### Scalability
- Support for multiple practices
- Concurrent transcription jobs via Celery
- Database connection pooling

## API Endpoints

### Appointments
- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments` - List appointments
- `GET /api/v1/appointments/{id}` - Get appointment
- `PATCH /api/v1/appointments/{id}` - Update appointment
- `DELETE /api/v1/appointments/{id}` - Delete appointment

### Recordings
- `POST /api/v1/recordings/upload/{appointment_id}` - Upload audio
- `GET /api/v1/recordings/{id}` - Get recording
- `GET /api/v1/recordings/appointment/{id}` - List for appointment

### Transcripts
- `POST /api/v1/transcripts/generate/{recording_id}` - Generate transcript
- `GET /api/v1/transcripts/{id}` - Get transcript
- `PATCH /api/v1/transcripts/{id}` - Update transcript

### Templates
- `POST /api/v1/templates` - Create template
- `GET /api/v1/templates` - List templates
- `GET /api/v1/templates/{id}` - Get template
- `PATCH /api/v1/templates/{id}` - Update template
- `DELETE /api/v1/templates/{id}` - Delete template

### Clinical Notes
- `POST /api/v1/notes/generate` - Generate note
- `GET /api/v1/notes/{id}` - Get note
- `PATCH /api/v1/notes/{id}` - Update note
- `GET /api/v1/notes/{id}/export/{format}` - Export note

## Data Models

See database migrations in `supabase/migrations/` for complete schema.

## Security

- All API endpoints require authentication
- Row-Level Security enforced at database level
- Audit logging for all PHI access
- Encrypted storage for audio files
