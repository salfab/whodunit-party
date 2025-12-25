-- Ensure game_sessions has full replica identity
ALTER TABLE game_sessions REPLICA IDENTITY FULL;

-- Add game_sessions to supabase_realtime publication if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'game_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
  END IF;
END;
$$;
