-- Add synopsis column to mysteries table
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS synopsis TEXT;

-- Add comment to document the column
COMMENT ON COLUMN mysteries.synopsis IS 'Short 1-sentence summary (10-400 chars), out-of-roleplay, no spoilers';
