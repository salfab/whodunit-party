-- Add occupation field to character_sheets table
ALTER TABLE character_sheets 
ADD COLUMN occupation TEXT;

-- Add comment for clarity
COMMENT ON COLUMN character_sheets.occupation IS 'Optional occupation/title for the character (e.g., Butler, Detective). When absent, character_name may contain both name and occupation.';
