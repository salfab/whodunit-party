-- Add adult_content flag to mysteries table
ALTER TABLE mysteries ADD COLUMN adult_content BOOLEAN NOT NULL DEFAULT false;

-- Document the column
COMMENT ON COLUMN mysteries.adult_content IS 'Whether the mystery contains adult / NSFW themes (sexual, graphic gore, drugs). Hidden from rooms unless the host opts in.';
