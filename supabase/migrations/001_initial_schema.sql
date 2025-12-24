-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE player_role AS ENUM ('investigator', 'guilty', 'innocent');
CREATE TYPE player_status AS ENUM ('active', 'quit', 'accused');
CREATE TYPE session_status AS ENUM ('lobby', 'playing', 'completed');

-- Mysteries table
CREATE TABLE mysteries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Character sheets table
CREATE TABLE character_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  role player_role NOT NULL,
  dark_secret TEXT NOT NULL,
  words_to_place TEXT[] NOT NULL,
  alibi TEXT NOT NULL,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_words_count CHECK (array_length(words_to_place, 1) = 3)
);

CREATE INDEX idx_character_sheets_mystery_id ON character_sheets(mystery_id);
CREATE INDEX idx_character_sheets_role ON character_sheets(role);

-- Game sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status player_status NOT NULL DEFAULT 'active',
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_last_heartbeat ON players(last_heartbeat);

-- Player assignments table (links players to character sheets for a specific round)
CREATE TABLE player_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  investigator_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  accused_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  was_correct BOOLEAN NOT NULL,
  accusation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, mystery_id)
);

CREATE INDEX idx_rounds_session ON rounds(session_id);
CREATE INDEX idx_rounds_mystery ON rounds(mystery_id);

-- Player ready states table (tracks consensus for mystery progression)
CREATE TABLE player_ready_states (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mystery_id UUID REFERENCES mysteries(id) ON DELETE CASCADE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id, mystery_id)
);

CREATE INDEX idx_player_ready_states_session_mystery ON player_ready_states(session_id, mystery_id);

-- Enable Row Level Security
ALTER TABLE mysteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ready_states ENABLE ROW LEVEL SECURITY;

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
