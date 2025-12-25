
DO $$ 
BEGIN
    -- Add round_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rounds' AND column_name = 'round_number'
    ) THEN
        ALTER TABLE rounds ADD COLUMN round_number INTEGER NOT NULL DEFAULT 1;
    END IF;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'rounds' AND indexname = 'idx_rounds_round_number'
    ) THEN
        CREATE INDEX idx_rounds_round_number ON rounds(round_number);
    END IF;
END $$;
