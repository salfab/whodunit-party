-- Add language column to game_sessions table
ALTER TABLE game_sessions ADD COLUMN language TEXT;

-- Update existing sessions with default language
UPDATE game_sessions SET language = 'fr' WHERE language IS NULL;

-- Make language required for future inserts
ALTER TABLE game_sessions ALTER COLUMN language SET NOT NULL;

-- Add constraint to validate language code format (2-character codes)
ALTER TABLE game_sessions ADD CONSTRAINT check_language_format CHECK (length(language) = 2);
