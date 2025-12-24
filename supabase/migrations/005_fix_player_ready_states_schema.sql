-- Fix player_ready_states schema: players are ready for the SESSION, not per mystery
-- The session tracks current_mystery_id, not individual ready states

-- Drop the old table
DROP TABLE IF EXISTS player_ready_states CASCADE;

-- Recreate with correct structure (no mystery_id)
CREATE TABLE player_ready_states (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id)
);

CREATE INDEX idx_player_ready_states_session ON player_ready_states(session_id);

-- Enable Row Level Security
ALTER TABLE player_ready_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to player_ready_states"
  ON player_ready_states FOR SELECT
  USING (true);

CREATE POLICY "Allow players to insert their own ready states"
  ON player_ready_states FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow players to update their own ready states"
  ON player_ready_states FOR UPDATE
  USING (true);

CREATE POLICY "Allow players to delete their own ready states"
  ON player_ready_states FOR DELETE
  USING (true);

-- Remove the sentinel mystery we added as a workaround (no longer needed)
DELETE FROM mysteries WHERE id = '00000000-0000-0000-0000-000000000000';
