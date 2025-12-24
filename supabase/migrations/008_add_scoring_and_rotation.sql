-- Add scoring and investigator rotation system
-- This migration adds:
-- 1. Score tracking for players
-- 2. Investigator rotation tracking
-- 3. Round number for multiple rounds per session
-- 4. Mystery voting system

-- Add score and investigator tracking to players table
ALTER TABLE players
ADD COLUMN score INT DEFAULT 0,
ADD COLUMN has_been_investigator BOOLEAN DEFAULT FALSE;

-- Add round number to rounds table and remove unique constraint
ALTER TABLE rounds
ADD COLUMN round_number INT DEFAULT 1;

-- Remove the unique constraint that limited one accusation per mystery per session
ALTER TABLE rounds
DROP CONSTRAINT IF EXISTS rounds_session_id_mystery_id_key;

-- Create mystery voting table
CREATE TABLE mystery_votes (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id, round_number)
);

-- Enable realtime for mystery_votes table
ALTER TABLE mystery_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE mystery_votes;

-- Add indexes for better query performance
CREATE INDEX idx_mystery_votes_session_round ON mystery_votes(session_id, round_number);
CREATE INDEX idx_players_session_investigator ON players(session_id, has_been_investigator) WHERE has_been_investigator = FALSE;
CREATE INDEX idx_rounds_session_number ON rounds(session_id, round_number);

-- Add comment for documentation
COMMENT ON TABLE mystery_votes IS 'Tracks player votes for next mystery to play in multi-round games';
COMMENT ON COLUMN players.score IS 'Total points accumulated across all rounds (+2 investigator correct, +1 innocent wrongly accused, +2 guilty escaped)';
COMMENT ON COLUMN players.has_been_investigator IS 'Tracks if player has been investigator to ensure fair rotation';
COMMENT ON COLUMN rounds.round_number IS 'Sequential round number within a game session';
