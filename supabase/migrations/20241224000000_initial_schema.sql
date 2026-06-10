-- Initial Schema for Whodunit Party Game
-- Consolidated migration including all features

-- Enable UUID extension


-- Create enum types
CREATE TYPE player_role AS ENUM ('investigator', 'guilty', 'innocent');
CREATE TYPE player_status AS ENUM ('active', 'quit', 'accused');
CREATE TYPE session_status AS ENUM ('lobby', 'playing', 'completed');

-- Mysteries table
CREATE TABLE mysteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  innocent_words TEXT[] NOT NULL DEFAULT '{}',
  guilty_words TEXT[] NOT NULL DEFAULT '{}',
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_innocent_words_count CHECK (array_length(innocent_words, 1) = 3),
  CONSTRAINT check_guilty_words_count CHECK (array_length(guilty_words, 1) = 3)
);

-- Character sheets table
CREATE TABLE character_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  role player_role NOT NULL,
  dark_secret TEXT NOT NULL,
  alibi TEXT NOT NULL,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_character_sheets_mystery_id ON character_sheets(mystery_id);
CREATE INDEX idx_character_sheets_role ON character_sheets(role);

-- Game sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status session_status NOT NULL DEFAULT 'lobby',
  join_code TEXT NOT NULL UNIQUE,
  current_mystery_id UUID REFERENCES mysteries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_join_code ON game_sessions(join_code);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status player_status NOT NULL DEFAULT 'active',
  score INT DEFAULT 0,
  has_been_investigator BOOLEAN DEFAULT FALSE,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_last_heartbeat ON players(last_heartbeat);
CREATE INDEX idx_players_session_investigator ON players(session_id, has_been_investigator) WHERE has_been_investigator = FALSE;

-- Player assignments table (links players to character sheets for a specific round)
CREATE TABLE player_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES character_sheets(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id, mystery_id)
);

CREATE INDEX idx_player_assignments_session_player ON player_assignments(session_id, player_id);
CREATE INDEX idx_player_assignments_mystery ON player_assignments(mystery_id);

-- Rounds table (tracks accusations and results)
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  investigator_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  accused_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  was_correct BOOLEAN NOT NULL,
  round_number INT DEFAULT 1,
  accusation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rounds_session ON rounds(session_id);
CREATE INDEX idx_rounds_mystery ON rounds(mystery_id);
CREATE INDEX idx_rounds_session_number ON rounds(session_id, round_number);

-- Player ready states table (tracks consensus for game start)
CREATE TABLE player_ready_states (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id)
);

CREATE INDEX idx_player_ready_states_session ON player_ready_states(session_id);

-- Mystery voting table
CREATE TABLE mystery_votes (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id, round_number)
);

CREATE INDEX idx_mystery_votes_session_round ON mystery_votes(session_id, round_number);

-- Enable Row Level Security
ALTER TABLE mysteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ready_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE mystery_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public reads, service role for writes
CREATE POLICY "Allow public read access to mysteries"
  ON mysteries FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to character_sheets"
  ON character_sheets FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to game_sessions"
  ON game_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to players"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to player_assignments"
  ON player_assignments FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to rounds"
  ON rounds FOR SELECT
  USING (true);

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

-- Function to auto-mark players as quit after 30 seconds of no heartbeat
CREATE OR REPLACE FUNCTION mark_inactive_players_as_quit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE players
  SET status = 'quit'
  WHERE status = 'active'
    AND last_heartbeat < NOW() - INTERVAL '30 seconds';
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game_sessions updated_at
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for player_ready_states updated_at
CREATE TRIGGER update_player_ready_states_updated_at
  BEFORE UPDATE ON player_ready_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE player_ready_states REPLICA IDENTITY FULL;
ALTER TABLE player_assignments REPLICA IDENTITY FULL;
ALTER TABLE rounds REPLICA IDENTITY FULL;
ALTER TABLE game_sessions REPLICA IDENTITY FULL;
ALTER TABLE mystery_votes REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_ready_states;
ALTER PUBLICATION supabase_realtime ADD TABLE player_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE mystery_votes;

-- Comments for documentation
COMMENT ON TABLE mystery_votes IS 'Tracks player votes for next mystery to play in multi-round games';
COMMENT ON COLUMN players.score IS 'Total points accumulated across all rounds (+2 investigator correct, +1 innocent wrongly accused, +2 guilty escaped)';
COMMENT ON COLUMN players.has_been_investigator IS 'Tracks if player has been investigator to ensure fair rotation';
COMMENT ON COLUMN rounds.round_number IS 'Sequential round number within a game session';

-- NOTE (2026-06-10, word-pool migration): the inline demo mysteries that used
-- to be seeded here (7 English mysteries with legacy fixed innocent/guilty
-- words) were removed so that fresh databases replay cleanly with the
-- word_pool schema. Canonical content now lives in seed-data/mysteries/*.zip
-- and is imported via `pnpm seed:mysteries` (upload-pack API).
