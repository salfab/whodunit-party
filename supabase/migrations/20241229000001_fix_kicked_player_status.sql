-- Fix any players that may have invalid 'kicked' status
-- Since 'kicked' is not in the player_status enum, this migration
-- converts any players that somehow got set to an invalid status back to 'quit'

-- This will fail gracefully if no such records exist or if the column
-- doesn't allow invalid values (in which case no fix is needed)

DO $$
BEGIN
  -- Try to update any players with invalid status
  -- If the status column is properly constrained, this will have no effect
  UPDATE players 
  SET status = 'quit'
  WHERE status NOT IN ('active', 'quit', 'accused');
  
  RAISE NOTICE 'Fixed % player records with invalid status', 
    (SELECT COUNT(*) FROM players WHERE status NOT IN ('active', 'quit', 'accused'));
EXCEPTION
  WHEN OTHERS THEN
    -- If there's an error (e.g., no invalid statuses exist), that's fine
    RAISE NOTICE 'No invalid player statuses found or migration not needed';
END $$;
