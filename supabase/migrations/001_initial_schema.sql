-- NoteSmith Database Schema
-- This migration creates the initial schema for the NoteSmith application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'dentist', 'hygienist', 'assistant', 'staff');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE recording_status AS ENUM ('uploading', 'uploaded', 'processing', 'transcribed', 'failed');
CREATE TYPE transcript_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE template_type AS ENUM ('soap', 'dap', 'narrative', 'custom');
CREATE TYPE note_status AS ENUM ('draft', 'generated', 'reviewed', 'finalized', 'exported');

-- Practices table
CREATE TABLE practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    patient_ref VARCHAR(255) NOT NULL, -- External patient reference (no PHI)
    appointment_date TIMESTAMPTZ NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings table
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    duration_seconds INTEGER,
    status recording_status DEFAULT 'uploading',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    content TEXT DEFAULT '',
    segments JSONB DEFAULT '[]',
    speaker_labels JSONB DEFAULT '[]',
    status transcript_status DEFAULT 'pending',
    language VARCHAR(10) DEFAULT 'en',
    word_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE, -- NULL for system templates
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type template_type DEFAULT 'custom',
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Notes table
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
    generated_content TEXT NOT NULL,
    final_content TEXT,
    analysis JSONB,
    status note_status DEFAULT 'draft',
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table for HIPAA compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_appointments_practice_id ON appointments(practice_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date DESC);
CREATE INDEX idx_recordings_appointment_id ON recordings(appointment_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_transcripts_recording_id ON transcripts(recording_id);
CREATE INDEX idx_transcripts_status ON transcripts(status);
CREATE INDEX idx_templates_practice_id ON templates(practice_id);
CREATE INDEX idx_templates_type ON templates(template_type);
CREATE INDEX idx_clinical_notes_transcript_id ON clinical_notes(transcript_id);
CREATE INDEX idx_clinical_notes_status ON clinical_notes(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system templates
INSERT INTO templates (name, description, template_type, content, is_default, is_active) VALUES
(
    'SOAP Note',
    'Standard SOAP format (Subjective, Objective, Assessment, Plan)',
    'soap',
    E'DENTAL CLINICAL NOTE - SOAP FORMAT\n\nDate: {{ date }}\nProvider: {{ provider }}\n\nSUBJECTIVE:\nChief Complaint: {{ chief_complaint }}\n\nHistory of Present Illness:\n{{ subjective_notes }}\n\nOBJECTIVE:\nClinical Examination:\n{{ findings | bullet_list }}\n\nASSESSMENT:\n{{ assessment }}\n\nPLAN:\nProcedures Performed:\n{{ procedures | bullet_list }}\n\nRecommendations:\n{{ recommendations | numbered_list }}\n\nFollow-up: {{ follow_up }}\n\n_____________________________\nProvider Signature',
    TRUE,
    TRUE
),
(
    'DAP Note',
    'Data, Assessment, Plan format',
    'dap',
    E'DENTAL CLINICAL NOTE - DAP FORMAT\n\nDate: {{ date }}\nProvider: {{ provider }}\n\nDATA:\n{{ chief_complaint }}\n\nClinical Findings:\n{{ findings | bullet_list }}\n\nASSESSMENT:\n{{ assessment }}\n\nPLAN:\n{{ procedures | bullet_list }}\n\nRecommendations:\n{{ recommendations | numbered_list }}\n\n_____________________________\nProvider Signature',
    FALSE,
    TRUE
),
(
    'Narrative Note',
    'Free-form narrative clinical note',
    'narrative',
    E'DENTAL CLINICAL NOTE\n\nDate: {{ date }}\nProvider: {{ provider }}\nPatient Reference: {{ patient_ref }}\n\n{{ summary }}\n\nChief Complaint:\n{{ chief_complaint }}\n\nClinical Findings:\n{{ findings | bullet_list }}\n\nTreatment Provided:\n{{ procedures | bullet_list }}\n\nRecommendations and Follow-up:\n{{ recommendations | bullet_list }}\n\n_____________________________\nProvider Signature',
    FALSE,
    TRUE
);

