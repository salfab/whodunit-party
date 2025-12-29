-- Add version column to mysteries table
ALTER TABLE mysteries ADD COLUMN version TEXT;

-- Set default version for existing mysteries
UPDATE mysteries SET version = '0.0.0' WHERE version IS NULL;

-- Set default for future inserts
ALTER TABLE mysteries ALTER COLUMN version SET DEFAULT '1.0.0';

-- Add comment
COMMENT ON COLUMN mysteries.version IS 'Semantic version number (e.g., 1.0.0) for tracking mystery updates';
