-- Backfill adult_content for the existing mysteries flagged by the product owner.
-- Three packs carry adult subtext encoded as wordplay (drug references, sexual
-- double-entendre) that a literal read misses:
--   - Rital sous Ritaline           (drugs: stimulants / Ritalin)
--   - Ma Neige Enchantée            (drugs: "neige"/powder = cocaine)
--   - Le "nez" hautbois de Pinokku  (sexual: bawdy double-entendre)
-- Titles match the seeded values exactly (note the straight double quotes in the
-- Pinokku title).
UPDATE mysteries
SET adult_content = true
WHERE title IN (
  'Rital sous Ritaline',
  'Ma Neige Enchantée',
  'Le "nez" hautbois de Pinokku'
);
