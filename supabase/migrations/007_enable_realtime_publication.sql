-- Enable Realtime publication for all key tables
-- This allows Supabase Realtime to broadcast changes to subscribed clients

ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_ready_states;
ALTER PUBLICATION supabase_realtime ADD TABLE player_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
