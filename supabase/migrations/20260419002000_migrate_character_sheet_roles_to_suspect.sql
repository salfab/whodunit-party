-- Align stored character sheet roles with the public pack model.
-- Runtime guilt is resolved per round, so character sheets only need to know
-- whether they are the investigator sheet or a suspect sheet.

ALTER TYPE player_role RENAME TO player_role_legacy;

CREATE TYPE player_role AS ENUM ('investigator', 'suspect');

ALTER TABLE character_sheets
  ALTER COLUMN role TYPE player_role
  USING CASE
    WHEN role::text = 'investigator' THEN 'investigator'::player_role
    ELSE 'suspect'::player_role
  END;

DROP TYPE player_role_legacy;
