SELECT relname, relreplident FROM pg_class WHERE relname = 'game_sessions';
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'game_sessions';