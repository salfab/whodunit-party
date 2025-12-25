-- Add theme column to mysteries table
ALTER TABLE mysteries ADD COLUMN theme TEXT NOT NULL DEFAULT 'SERIOUS_MURDER';

-- Add check constraint for valid theme values
ALTER TABLE mysteries ADD CONSTRAINT mysteries_theme_check 
  CHECK (theme IN ('PETTY_CRIME', 'MACABRE', 'SERIOUS_MURDER', 'FUNNY_CRIME'));

-- Add comment to document the column
COMMENT ON COLUMN mysteries.theme IS 'Theme category for the mystery (PETTY_CRIME, MACABRE, SERIOUS_MURDER, FUNNY_CRIME)';
