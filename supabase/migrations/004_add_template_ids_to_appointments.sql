-- Add template_ids field to appointments table
-- This allows users to specify which template(s) to use when processing an appointment

ALTER TABLE appointments
ADD COLUMN template_ids JSONB DEFAULT '[]';

-- Add index for better query performance
CREATE INDEX idx_appointments_template_ids ON appointments USING GIN (template_ids);

-- Add comment for documentation
COMMENT ON COLUMN appointments.template_ids IS 'Array of template UUIDs to use when generating clinical notes for this appointment';
