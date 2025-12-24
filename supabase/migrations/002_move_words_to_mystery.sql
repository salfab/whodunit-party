-- Migration to move words_to_place from character_sheets to mysteries
-- Add innocent_words and guilty_words to mysteries table
-- Remove words_to_place from character_sheets table

-- Add word arrays to mysteries
ALTER TABLE mysteries 
ADD COLUMN innocent_words TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN guilty_words TEXT[] NOT NULL DEFAULT '{}';

-- Add check constraint for word count
ALTER TABLE mysteries
ADD CONSTRAINT check_innocent_words_count CHECK (array_length(innocent_words, 1) = 3),
ADD CONSTRAINT check_guilty_words_count CHECK (array_length(guilty_words, 1) = 3);

-- Remove words_to_place from character_sheets
ALTER TABLE character_sheets 
DROP CONSTRAINT check_words_count,
DROP COLUMN words_to_place;
