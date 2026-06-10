-- Seed initial mysteries for whodunit-party
--
-- NOTE (2026-06-10, word-pool migration): this migration used to insert 5
-- French demo mysteries (without character sheets) using the legacy
-- innocent_words/guilty_words columns. They were removed so that fresh
-- databases replay cleanly with the word_pool schema. Canonical content now
-- lives in seed-data/mysteries/*.zip and is imported via
-- `pnpm seed:mysteries` (upload-pack API).

COMMENT ON COLUMN mysteries.theme IS 'Theme categorization: PETTY_CRIME, MACABRE, SERIOUS_MURDER, FUNNY_CRIME';
