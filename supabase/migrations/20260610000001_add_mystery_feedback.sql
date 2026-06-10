-- End-of-mystery player feedback: an overall rating plus per-word flags.
-- Normalized in two tables so word quality can be analyzed directly
-- (e.g. SELECT word, reason, count(*) ... GROUP BY word, reason).

CREATE TABLE IF NOT EXISTS mystery_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, mystery_id, player_id)
);

CREATE TABLE IF NOT EXISTS mystery_feedback_word_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES mystery_feedback(id) ON DELETE CASCADE,
  -- Denormalized so word analytics do not need a join back through feedback.
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('too_hard', 'too_obvious', 'too_generic', 'other')),
  reason_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mystery_feedback_mystery ON mystery_feedback(mystery_id);
CREATE INDEX IF NOT EXISTS idx_feedback_word_flags_mystery_word ON mystery_feedback_word_flags(mystery_id, word);

-- Enable RLS
ALTER TABLE mystery_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE mystery_feedback_word_flags ENABLE ROW LEVEL SECURITY;

-- Policies (writes go through the service-role API endpoint, which validates
-- the player session; these mirror the permissive policies on mystery_votes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback' AND policyname = 'Public read access'
    ) THEN
        CREATE POLICY "Public read access" ON mystery_feedback FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback' AND policyname = 'Public insert access'
    ) THEN
        CREATE POLICY "Public insert access" ON mystery_feedback FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback' AND policyname = 'Public update access'
    ) THEN
        CREATE POLICY "Public update access" ON mystery_feedback FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback' AND policyname = 'Public delete access'
    ) THEN
        CREATE POLICY "Public delete access" ON mystery_feedback FOR DELETE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback_word_flags' AND policyname = 'Public read access'
    ) THEN
        CREATE POLICY "Public read access" ON mystery_feedback_word_flags FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback_word_flags' AND policyname = 'Public insert access'
    ) THEN
        CREATE POLICY "Public insert access" ON mystery_feedback_word_flags FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback_word_flags' AND policyname = 'Public update access'
    ) THEN
        CREATE POLICY "Public update access" ON mystery_feedback_word_flags FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'mystery_feedback_word_flags' AND policyname = 'Public delete access'
    ) THEN
        CREATE POLICY "Public delete access" ON mystery_feedback_word_flags FOR DELETE USING (true);
    END IF;
END $$;
