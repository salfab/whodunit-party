-- Add include_adult_content preference to game_sessions table
-- Default false: a fresh room is family-friendly; the host opts in explicitly.
ALTER TABLE game_sessions ADD COLUMN include_adult_content BOOLEAN NOT NULL DEFAULT false;

-- Document the column
COMMENT ON COLUMN game_sessions.include_adult_content IS 'Whether this room includes adult / NSFW mysteries in the vote. Defaults to false (excluded).';
