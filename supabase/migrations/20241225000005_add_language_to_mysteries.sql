-- Add language column to mysteries table
ALTER TABLE mysteries ADD COLUMN language TEXT;

-- Update existing mysteries with default language
UPDATE mysteries SET language = 'fr' WHERE language IS NULL;

-- Make language required for future inserts
ALTER TABLE mysteries ALTER COLUMN language SET NOT NULL;

-- Add constraint to validate language code format (2-character codes)
ALTER TABLE mysteries ADD CONSTRAINT check_language_format CHECK (length(language) = 2);
