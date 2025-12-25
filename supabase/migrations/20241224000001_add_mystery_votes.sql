
CREATE TABLE IF NOT EXISTS mystery_votes (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id)
);

-- Enable RLS
ALTER TABLE mystery_votes ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_votes' AND policyname = 'Public read access'
    ) THEN
        CREATE POLICY "Public read access" ON mystery_votes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_votes' AND policyname = 'Public insert access'
    ) THEN
        CREATE POLICY "Public insert access" ON mystery_votes FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_votes' AND policyname = 'Public update access'
    ) THEN
        CREATE POLICY "Public update access" ON mystery_votes FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_votes' AND policyname = 'Public delete access'
    ) THEN
        CREATE POLICY "Public delete access" ON mystery_votes FOR DELETE USING (true);
    END IF;
END $$;

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mystery_votes'
  ) THEN
    alter publication supabase_realtime add table mystery_votes;
  END IF;
END $$;
