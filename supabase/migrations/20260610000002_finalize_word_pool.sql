-- Finalize the word-pool migration: every mystery must carry a 15-word pool,
-- and the legacy fixed-word columns are dropped.
--
-- DEPLOYMENT ORDER: run `pnpm seed:mysteries` (reimports all packs with their
-- word_pool and a bumped version) BEFORE applying this migration on a
-- database that holds pre-word-pool content. The guard below fails loudly,
-- with an actionable message, if any non-legacy mystery still lacks a pool.

-- 1) Remove the known legacy demo mysteries that never received a word pool.
--    They were seeded inline by old migrations (since neutralized): 7 English
--    demo mysteries (with sheets) and 5 French ones (without sheets, never
--    playable). All references cascade (sheets, assignments, rounds, votes).
DELETE FROM mysteries
WHERE word_pool IS NULL
  AND (
    -- French demo seeds had fixed UUIDs (20251225134427_seed_initial_mysteries.sql)
    id IN (
      '3a4b688b-3a29-4d26-8d3f-2ff66c6cd6a2', -- La ballade dérobée
      'baa8b7e2-9736-491c-98e8-94a32e71daea', -- La jambe de bois disparue
      '0dbe9c38-2f18-49be-b859-9c06d2bd1165', -- Le hamster en peluche
      'e5fae132-cbfe-4f20-898b-fdda5f576212', -- Le parapheur inversé (SwissCaution)
      '0ac88d1a-e8f3-4711-85f3-2b4b987fe400'  -- Le bocal de doigts & la confiture
    )
    -- English demo seeds were inserted without fixed ids (20241224000000_initial_schema.sql)
    OR title IN (
      'Murder at the Manor',
      'Death at the Opera House',
      'The Vanishing Heir',
      'Murder on the Orient Express',
      'Death at the Museum',
      'The Poisoned Playwright',
      'Murder at the Masquerade'
    )
  );

-- 2) Guard: any remaining mystery without a valid 15-word pool is unknown
--    content (e.g. created via the admin UI). Do not destroy it silently —
--    stop and let a human reimport or fix it first.
DO $$
DECLARE
  missing_count INT;
BEGIN
  SELECT count(*) INTO missing_count
  FROM mysteries
  WHERE word_pool IS NULL OR array_length(word_pool, 1) IS DISTINCT FROM 15;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'finalize_word_pool: % mysteries still lack a 15-word pool. Reimport the seed packs (pnpm seed:mysteries) or fix them, then re-run this migration.', missing_count;
  END IF;
END $$;

-- 3) Tighten the schema and drop the legacy columns.
ALTER TABLE mysteries
  ADD CONSTRAINT check_word_pool_count
  CHECK (word_pool IS NOT NULL AND array_length(word_pool, 1) = 15);
ALTER TABLE mysteries ALTER COLUMN word_pool SET NOT NULL;
ALTER TABLE mysteries DROP COLUMN IF EXISTS innocent_words;
ALTER TABLE mysteries DROP COLUMN IF EXISTS guilty_words;
