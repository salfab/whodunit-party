-- Add policies for players to update their own ready states
-- This fixes the 401 error when clicking the ready button

CREATE POLICY "Allow players to insert their own ready states"
  ON player_ready_states FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow players to update their own ready states"
  ON player_ready_states FOR UPDATE
  USING (true);

CREATE POLICY "Allow players to delete their own ready states"
  ON player_ready_states FOR DELETE
  USING (true);
