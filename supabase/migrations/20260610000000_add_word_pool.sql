-- Add the runtime word pool to mysteries.
-- The pool holds 15 neutral candidate words; at runtime 6 unique words are
-- drawn deterministically and partitioned into 3 guilty + 3 innocent words.
-- The legacy fixed-word columns are relaxed here and dropped in a later
-- migration once every mystery has been reimported with a word_pool.

ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS word_pool TEXT[];

-- Relax the legacy constraints so reimports can omit the old fixed words.
ALTER TABLE mysteries DROP CONSTRAINT IF EXISTS check_innocent_words_count;
ALTER TABLE mysteries DROP CONSTRAINT IF EXISTS check_guilty_words_count;

ALTER TABLE mysteries ALTER COLUMN innocent_words DROP NOT NULL;
ALTER TABLE mysteries ALTER COLUMN guilty_words DROP NOT NULL;
ALTER TABLE mysteries ALTER COLUMN innocent_words DROP DEFAULT;
ALTER TABLE mysteries ALTER COLUMN guilty_words DROP DEFAULT;

COMMENT ON COLUMN mysteries.word_pool IS '15 neutral candidate words; 6 are drawn and partitioned (3 guilty + 3 innocent) at runtime';
