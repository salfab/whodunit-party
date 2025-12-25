-- Add author column to mysteries table
ALTER TABLE mysteries ADD COLUMN author TEXT;

-- Update existing mysteries with default author
UPDATE mysteries SET author = 'Built-in' WHERE author IS NULL;

-- Make author required for future inserts
ALTER TABLE mysteries ALTER COLUMN author SET NOT NULL;
