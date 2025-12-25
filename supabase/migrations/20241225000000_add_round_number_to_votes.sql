
DO $$ 
BEGIN
    -- Add round_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mystery_votes' AND column_name = 'round_number'
    ) THEN
        ALTER TABLE mystery_votes ADD COLUMN round_number INTEGER NOT NULL DEFAULT 1;
    END IF;

    -- Update PK if needed
    -- We check if the PK constraint exists and recreate it to include round_number
    -- This is a bit simplified, assuming if round_number exists we want it in PK
    -- But to be safe, let's just drop and recreate if we added the column or if we want to enforce it
    
    -- Check if PK includes round_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.key_column_usage 
        WHERE table_name = 'mystery_votes' 
        AND constraint_name = 'mystery_votes_pkey' 
        AND column_name = 'round_number'
    ) THEN
        -- Drop old PK if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'mystery_votes' AND constraint_name = 'mystery_votes_pkey'
        ) THEN
            ALTER TABLE mystery_votes DROP CONSTRAINT mystery_votes_pkey;
        END IF;
        
        -- Add new PK
        ALTER TABLE mystery_votes ADD PRIMARY KEY (session_id, player_id, round_number);
    END IF;
END $$;
