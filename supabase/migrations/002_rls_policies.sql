-- Row Level Security Policies for HIPAA Compliance
-- Enable RLS on all tables

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's practice_id
CREATE OR REPLACE FUNCTION get_user_practice_id()
RETURNS UUID AS $$
    SELECT practice_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'admin' FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Practices policies
CREATE POLICY "Users can view their own practice"
    ON practices FOR SELECT
    USING (id = get_user_practice_id() OR is_admin());

CREATE POLICY "Admins can update their practice"
    ON practices FOR UPDATE
    USING (id = get_user_practice_id() AND is_admin());

-- Users policies
CREATE POLICY "Users can view users in their practice"
    ON users FOR SELECT
    USING (practice_id = get_user_practice_id() OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Appointments policies
CREATE POLICY "Users can view appointments in their practice"
    ON appointments FOR SELECT
    USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can create appointments in their practice"
    ON appointments FOR INSERT
    WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY "Users can update appointments in their practice"
    ON appointments FOR UPDATE
    USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can delete appointments in their practice"
    ON appointments FOR DELETE
    USING (practice_id = get_user_practice_id());

-- Recordings policies
CREATE POLICY "Users can view recordings for their practice's appointments"
    ON recordings FOR SELECT
    USING (
        appointment_id IN (
            SELECT id FROM appointments WHERE practice_id = get_user_practice_id()
        )
    );

CREATE POLICY "Users can create recordings for their practice's appointments"
    ON recordings FOR INSERT
    WITH CHECK (
        appointment_id IN (
            SELECT id FROM appointments WHERE practice_id = get_user_practice_id()
        )
    );

CREATE POLICY "Users can update recordings for their practice's appointments"
    ON recordings FOR UPDATE
    USING (
        appointment_id IN (
            SELECT id FROM appointments WHERE practice_id = get_user_practice_id()
        )
    );

CREATE POLICY "Users can delete recordings for their practice's appointments"
    ON recordings FOR DELETE
    USING (
        appointment_id IN (
            SELECT id FROM appointments WHERE practice_id = get_user_practice_id()
        )
    );

-- Transcripts policies
CREATE POLICY "Users can view transcripts for their practice's recordings"
    ON transcripts FOR SELECT
    USING (
        recording_id IN (
            SELECT r.id FROM recordings r
            JOIN appointments a ON r.appointment_id = a.id
            WHERE a.practice_id = get_user_practice_id()
        )
    );

CREATE POLICY "Users can create transcripts for their practice's recordings"
    ON transcripts FOR INSERT
    WITH CHECK (
        recording_id IN (
            SELECT r.id FROM recordings r
            JOIN appointments a ON r.appointment_id = a.id
            WHERE a.practice_id = get_user_practice_id()
        )
    );

CREATE POLICY "Users can update transcripts for their practice's recordings"
    ON transcripts FOR UPDATE
    USING (
        recording_id IN (
            SELECT r.id FROM recordings r
            JOIN appointments a ON r.appointment_id = a.id
            WHERE a.practice_id = get_user_practice_id()
        )
    );

-- Templates policies
CREATE POLICY "Users can view system templates and their practice's templates"
    ON templates FOR SELECT
    USING (practice_id IS NULL OR practice_id = get_user_practice_id());

CREATE POLICY "Users can create templates for their practice"
    ON templates FOR INSERT
    WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY "Users can update their practice's templates"
    ON templates FOR UPDATE
    USING (practice_id = get_user_practice_id());

CREATE POLICY "Users can delete their practice's templates"
    ON templates FOR DELETE
    USING (practice_id = get_user_practice_id() AND practice_id IS NOT NULL);

-- Clinical notes policies
CREATE POLICY "Users can view notes for their practice's transcripts"
    ON clinical_notes FOR SELECT
    USING (
        transcript_id IN (
            SELECT t.id FROM transcripts t
            JOIN recordings r ON t.recording_id = r.id
            JOIN appointments a ON r.appointment_id = a.id
            WHERE a.practice_id = get_user_practice_id()
        )
    );

CREATE POLICY "Users can create notes for their practice's transcripts"
    ON clinical_notes FOR INSERT
    WITH CHECK (
        transcript_id IN (
            SELECT t.id FROM transcripts t
            JOIN recordings r ON t.recording_id = r.id
            JOIN appointments a ON r.appointment_id = a.id
            WHERE a.practice_id = get_user_practice_id()
        )
    );

CREATE POLICY "Users can update notes for their practice's transcripts"
    ON clinical_notes FOR UPDATE
    USING (
        transcript_id IN (
            SELECT t.id FROM transcripts t
            JOIN recordings r ON t.recording_id = r.id
            JOIN appointments a ON r.appointment_id = a.id
            WHERE a.practice_id = get_user_practice_id()
        )
    );

-- Audit logs policies (read-only for users, write via service role)
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

-- Storage policies for recordings bucket
-- Note: Run these in Supabase Dashboard > Storage > Policies

-- CREATE POLICY "Users can upload recordings"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'recordings' AND
--     auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Users can view their practice's recordings"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'recordings' AND
--     auth.uid() IS NOT NULL
-- );

-- CREATE POLICY "Users can delete their practice's recordings"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'recordings' AND
--     auth.uid() IS NOT NULL
-- );

