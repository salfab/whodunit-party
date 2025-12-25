-- Add character_name column to character_sheets table
ALTER TABLE character_sheets ADD COLUMN character_name TEXT;

-- Update existing character sheets with default names based on role
UPDATE character_sheets SET character_name = CASE
  WHEN role = 'investigator' THEN 'L''Enquêteur'
  WHEN role = 'guilty' THEN 'Le Coupable'
  WHEN role = 'innocent' THEN 'Un Innocent'
END WHERE character_name IS NULL;

-- Make character_name required for future inserts
ALTER TABLE character_sheets ALTER COLUMN character_name SET NOT NULL;
