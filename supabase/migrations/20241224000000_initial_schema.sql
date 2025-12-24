-- Initial Schema for Whodunit Party Game
-- Consolidated migration including all features

-- Enable UUID extension


-- Create enum types
CREATE TYPE player_role AS ENUM ('investigator', 'guilty', 'innocent');
CREATE TYPE player_status AS ENUM ('active', 'quit', 'accused');
CREATE TYPE session_status AS ENUM ('lobby', 'playing', 'completed');

-- Mysteries table
CREATE TABLE mysteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  innocent_words TEXT[] NOT NULL DEFAULT '{}',
  guilty_words TEXT[] NOT NULL DEFAULT '{}',
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_innocent_words_count CHECK (array_length(innocent_words, 1) = 3),
  CONSTRAINT check_guilty_words_count CHECK (array_length(guilty_words, 1) = 3)
);

-- Character sheets table
CREATE TABLE character_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  role player_role NOT NULL,
  dark_secret TEXT NOT NULL,
  alibi TEXT NOT NULL,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_character_sheets_mystery_id ON character_sheets(mystery_id);
CREATE INDEX idx_character_sheets_role ON character_sheets(role);

-- Game sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status session_status NOT NULL DEFAULT 'lobby',
  join_code TEXT NOT NULL UNIQUE,
  current_mystery_id UUID REFERENCES mysteries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_join_code ON game_sessions(join_code);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status player_status NOT NULL DEFAULT 'active',
  score INT DEFAULT 0,
  has_been_investigator BOOLEAN DEFAULT FALSE,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_last_heartbeat ON players(last_heartbeat);
CREATE INDEX idx_players_session_investigator ON players(session_id, has_been_investigator) WHERE has_been_investigator = FALSE;

-- Player assignments table (links players to character sheets for a specific round)
CREATE TABLE player_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES character_sheets(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id, mystery_id)
);

CREATE INDEX idx_player_assignments_session_player ON player_assignments(session_id, player_id);
CREATE INDEX idx_player_assignments_mystery ON player_assignments(mystery_id);

-- Rounds table (tracks accusations and results)
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  investigator_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  accused_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  was_correct BOOLEAN NOT NULL,
  round_number INT DEFAULT 1,
  accusation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rounds_session ON rounds(session_id);
CREATE INDEX idx_rounds_mystery ON rounds(mystery_id);
CREATE INDEX idx_rounds_session_number ON rounds(session_id, round_number);

-- Player ready states table (tracks consensus for game start)
CREATE TABLE player_ready_states (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id)
);

CREATE INDEX idx_player_ready_states_session ON player_ready_states(session_id);

-- Mystery voting table
CREATE TABLE mystery_votes (
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, player_id, round_number)
);

CREATE INDEX idx_mystery_votes_session_round ON mystery_votes(session_id, round_number);

-- Enable Row Level Security
ALTER TABLE mysteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ready_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE mystery_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public reads, service role for writes
CREATE POLICY "Allow public read access to mysteries"
  ON mysteries FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to character_sheets"
  ON character_sheets FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to game_sessions"
  ON game_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to players"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to player_assignments"
  ON player_assignments FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to rounds"
  ON rounds FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to player_ready_states"
  ON player_ready_states FOR SELECT
  USING (true);

CREATE POLICY "Allow players to insert their own ready states"
  ON player_ready_states FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow players to update their own ready states"
  ON player_ready_states FOR UPDATE
  USING (true);

CREATE POLICY "Allow players to delete their own ready states"
  ON player_ready_states FOR DELETE
  USING (true);

-- Function to auto-mark players as quit after 30 seconds of no heartbeat
CREATE OR REPLACE FUNCTION mark_inactive_players_as_quit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE players
  SET status = 'quit'
  WHERE status = 'active'
    AND last_heartbeat < NOW() - INTERVAL '30 seconds';
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game_sessions updated_at
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for player_ready_states updated_at
CREATE TRIGGER update_player_ready_states_updated_at
  BEFORE UPDATE ON player_ready_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE player_ready_states REPLICA IDENTITY FULL;
ALTER TABLE player_assignments REPLICA IDENTITY FULL;
ALTER TABLE rounds REPLICA IDENTITY FULL;
ALTER TABLE game_sessions REPLICA IDENTITY FULL;
ALTER TABLE mystery_votes REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_ready_states;
ALTER PUBLICATION supabase_realtime ADD TABLE player_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE mystery_votes;

-- Comments for documentation
COMMENT ON TABLE mystery_votes IS 'Tracks player votes for next mystery to play in multi-round games';
COMMENT ON COLUMN players.score IS 'Total points accumulated across all rounds (+2 investigator correct, +1 innocent wrongly accused, +2 guilty escaped)';
COMMENT ON COLUMN players.has_been_investigator IS 'Tracks if player has been investigator to ensure fair rotation';
COMMENT ON COLUMN rounds.round_number IS 'Sequential round number within a game session';

-- Seed initial mysteries with character sheets
-- Mystery 1: Murder at the Manor
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'Murder at the Manor',
  E'## The Crime\n\nLord Blackwood was found dead in his study at midnight, poisoned by arsenic in his evening brandy. The doors were locked from the inside, and only five guests had access to the study that evening.\n\n## Your Mission\n\nAs the investigator, you must question each guest, listen for their alibis, and determine who among them is guilty. Each person has secrets to hide, but only one is the murderer.',
  ARRAY['manuscript', 'inheritance', 'betrayal'],
  ARRAY['ledger', 'poison', 'desperate'],
  NULL
);

DO $$
DECLARE
  manor_mystery_id UUID;
BEGIN
  SELECT id INTO manor_mystery_id FROM mysteries WHERE title = 'Murder at the Manor';

  -- Investigator
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    manor_mystery_id,
    'investigator',
    'You secretly **gambled away your family fortune** at the gentleman''s club. You came to the manor hoping to borrow money from Lord Blackwood to pay off your debts before your family discovers the truth.',
    E'I was in the **conservatory** all evening, reading Lord Blackwood''s latest manuscript. I needed to prepare notes for our morning discussion about publishing rights.\n\nI did not leave the conservatory until I heard the screams.'
  );

  -- Guilty
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    manor_mystery_id,
    'guilty',
    E'You''ve been **embezzling funds** from Lord Blackwood''s estate for two years. Tonight, he discovered your ledger and threatened to report you to the authorities unless you confessed.\n\nYou couldn''t let that happen. You slipped arsenic into his brandy while serving him in the study.',
    E'I was in my **private chambers** on the second floor, writing letters to my family back home. I have the drafts as proof.\n\nI only came downstairs when I heard the commotion.'
  );

  -- Innocent 1
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    manor_mystery_id,
    'innocent',
    E'You''re having a **passionate affair** with Lady Blackwood. Tonight was supposed to be your secret rendezvous in the garden house, but she never showed up.\n\nYou''re terrified someone might have seen you waiting.',
    E'I was taking a long **walk in the garden**, enjoying the moonlight and fresh air. The weather was pleasant, and I needed time alone to think.\n\nI was near the pond when I heard the bells ringing.'
  );

  -- Innocent 2
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    manor_mystery_id,
    'innocent',
    E'Last month, you **stole Lord Blackwood''s valuable Renaissance painting** and replaced it with a masterful forgery. You''ve already sold the original at auction in Paris.\n\nYou live in fear that he''ll discover the switch.',
    E'I was in the **billiard room** practicing shots alone. I''m an amateur player, and I find the practice calming.\n\nI didn''t realize anything was wrong until the butler came running in.'
  );

  -- Innocent 3
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    manor_mystery_id,
    'innocent',
    'You **witnessed the murder** through the study window while walking past. You saw someone slip something into Lord Blackwood''s drink, but you''re too afraid to speak up.\n\nWhat if the killer comes for you next?',
    E'I retired to my **bedroom** early with a headache. I took a sleeping draught and was in bed by 10 PM.\n\nI heard nothing unusual until morning.'
  );
END $$;

-- Mystery 2: Death at the Opera House
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'Death at the Opera House',
  E'## The Crime\n\nDiva Valentina Rose collapsed on stage during the final act of *La Traviata*. The autopsy revealed **cyanide poisoning** in her makeup.\n\n## The Setting\n\nBackstage at the Grand Opera House. Five people had access to her dressing room in the hour before her death.',
  ARRAY['reputation', 'expose', 'truth'],
  ARRAY['composition', 'revenge', 'justice'],
  NULL
);

DO $$
DECLARE
  opera_mystery_id UUID;
BEGIN
  SELECT id INTO opera_mystery_id FROM mysteries WHERE title = 'Death at the Opera House';

  -- Investigator
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    opera_mystery_id,
    'investigator',
    'You''re a **disgraced former opera critic** who lost your job after a scandal involving fabricated reviews. You''re here under a false identity, hoping to redeem yourself by writing about Valentina.',
    E'I was in the **press box** taking notes during the entire performance. My detailed timeline of events should prove my whereabouts.\n\nI only learned of her death when the show stopped.'
  );

  -- Guilty
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    opera_mystery_id,
    'guilty',
    E'Valentina stole your original composition and claimed it as her own, launching her career while you remained unknown. Tonight was your **revenge**.\n\nYou mixed cyanide into her stage makeup, knowing she''d apply a fresh layer during intermission.',
    E'I was in the **orchestra pit** conducting the performance. I never left my position until the tragic collapse.\n\nHundreds of people saw me there.'
  );

  -- Innocent 1
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    opera_mystery_id,
    'innocent',
    E'You''re Valentina''s **secret daughter** she gave up for adoption 20 years ago. You came here tonight to finally confront her, but now you''ll never get that chance.',
    E'I was in the **costume room** repairing torn dresses. I have the needlework to prove it.\n\nI was shocked when I heard the screams.'
  );

  -- Innocent 2
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    opera_mystery_id,
    'innocent',
    E'You''ve been **sabotaging other performers** to ensure Valentina''s success. You''ve cut costume straps, hidden props, and spread malicious rumors.\n\nBut you never wanted her dead.',
    E'I was in the **lighting booth** operating the spotlights. The technical crew can confirm I was there the entire time.\n\nI couldn''t believe it when she collapsed.'
  );

  -- Innocent 3
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    opera_mystery_id,
    'innocent',
    'You discovered Valentina was **planning to expose a major corruption scandal** in the opera world. You tried to convince her to stay quiet, but she refused.\n\nNow someone silenced her permanently.',
    E'I was in my **office** reviewing next season''s budget. I have spreadsheets timestamped from that evening.\n\nI only came to the stage when I heard the commotion.'
  );
END $$;

-- Mystery 3: The Vanishing Heir
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'The Vanishing Heir',
  E'## The Crime\n\nYoung heir Alexandre Montfort was found dead in the wine cellar of his family château, strangled with a silk cravat. He was supposed to announce his engagement at tonight''s gala.\n\n## The Setting\n\nA grand château in the French countryside. Five family members and associates had the opportunity to reach the wine cellar during the evening reception.',
  ARRAY['inheritance', 'wedding', 'fortune'],
  ARRAY['debt', 'conspiracy', 'desperation'],
  NULL
);

DO $$
DECLARE
  heir_mystery_id UUID;
BEGIN
  SELECT id INTO heir_mystery_id FROM mysteries WHERE title = 'The Vanishing Heir';

  -- Investigator
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    heir_mystery_id,
    'investigator',
    'You were Alexandre''s **childhood tutor** who was dismissed in disgrace after being falsely accused of theft. You came tonight hoping to clear your name and expose the real thief.',
    E'I was in the **library** reading old family records, searching for evidence to prove my innocence.\n\nI heard the gong for dinner and was heading there when the body was discovered.'
  );

  -- Guilty
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    heir_mystery_id,
    'guilty',
    E'Alexandre discovered you''ve been **forging documents** to embezzle from the family trust for years. He was going to expose you tonight after the engagement announcement.\n\nYou lured him to the wine cellar with a fake note and strangled him with his own cravat.',
    E'I was in the **ballroom** greeting guests and overseeing the catering arrangements. The staff can confirm I was coordinating everything.\n\nI only went to the cellar when we couldn''t find Alexandre.'
  );

  -- Innocent 1
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    heir_mystery_id,
    'innocent',
    'You''re Alexandre''s **illegitimate half-brother** that the family refuses to acknowledge. You came tonight hoping to finally claim your share of the inheritance.',
    E'I was on the **terrace** smoking cigars with other guests. At least four people can vouch for me.\n\nI was shocked when they found him dead.'
  );

  -- Innocent 2
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    heir_mystery_id,
    'innocent',
    'Alexandre was planning to marry your **secret lover**, breaking your heart. You wrote him threatening letters, but you never acted on them.',
    E'I was in the **powder room** repairing my dress after spilling wine on it. I was alone for nearly 20 minutes.\n\nI returned just as they started searching for Alexandre.'
  );

  -- Innocent 3
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    heir_mystery_id,
    'innocent',
    'You witnessed Alexandre having a **violent argument** with someone earlier, but you''re terrified to speak up because they threatened you.',
    E'I was in the **music room** playing the piano for early arrivals. Several guests complimented my performance.\n\nI had no idea anything was wrong until the screaming started.'
  );
END $$;

-- Mystery 4: Murder on the Orient Express
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'Murder on the Orient Express',
  E'## The Crime\n\nWealth industrialist Mr. Sterling was found stabbed twelve times in his locked compartment on the luxury train. The murder occurred somewhere between Paris and Vienna.\n\n## The Setting\n\nAboard the famous Orient Express. Five passengers in the adjacent compartments are suspects.',
  ARRAY['journey', 'business', 'destination'],
  ARRAY['account', 'evidence', 'mistake'],
  NULL
);

DO $$
DECLARE
  train_mystery_id UUID;
BEGIN
  SELECT id INTO train_mystery_id FROM mysteries WHERE title = 'Murder on the Orient Express';

  -- Investigator
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    train_mystery_id,
    'investigator',
    'You''re a **former detective** who was forced to retire after accepting a bribe to look the other way. You''re traveling incognito, hoping no one recognizes you.',
    E'I was in the **dining car** having a late supper with the conductor. We discussed the train schedule and I showed him my ticket.\n\nI returned to my compartment around midnight.'
  );

  -- Guilty
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    train_mystery_id,
    'guilty',
    E'Mr. Sterling **destroyed your family''s factory**, leaving hundreds unemployed including your elderly parents who died in poverty. You''ve waited years for this moment of justice.\n\nYou crept into his compartment while he slept and struck twelve times—once for each member of your family who suffered.',
    E'I was **asleep in my compartment** the entire night. I took a sleeping draught because of my chronic insomnia.\n\nI heard nothing until the morning commotion.'
  );

  -- Innocent 1
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    train_mystery_id,
    'innocent',
    'You''re carrying **stolen diamonds** worth a fortune, hidden in your luggage. You''re terrified the investigation will uncover them.',
    E'I was in the **observation car** watching the countryside pass by. I couldn''t sleep and needed fresh air.\n\nThe porter saw me there around 11 PM.'
  );

  -- Innocent 2
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    train_mystery_id,
    'innocent',
    'You''re **fleeing from an arranged marriage** to a cruel aristocrat. If anyone discovers your real identity, they''ll send you back.',
    E'I was in my **compartment** writing farewell letters to my family. I have the letters dated and sealed.\n\nI heard shouting in the corridor early this morning.'
  );

  -- Innocent 3
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    train_mystery_id,
    'innocent',
    'You saw someone **sneaking toward Mr. Sterling''s compartment** late at night, but you''re afraid to speak up because they might target you next.',
    E'I was in the **smoking car** playing cards with three other passengers until 2 AM. We had quite a game going.\n\nI only learned about the murder at breakfast.'
  );
END $$;

-- Mystery 5: Death at the Museum
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'Death at the Museum',
  E'## The Crime\n\nRenowned archaeologist Dr. Harrison Wells was found dead in the Egyptian wing, poisoned by a **rare toxin** derived from ancient herbs. His latest discovery was about to be unveiled.\n\n## The Setting\n\nThe Metropolitan Museum after hours. Five colleagues had special access to the restricted exhibition.',
  ARRAY['discovery', 'authentic', 'recognition'],
  ARRAY['forgery', 'expose', 'career'],
  NULL
);

DO $$
DECLARE
  museum_mystery_id UUID;
BEGIN
  SELECT id INTO museum_mystery_id FROM mysteries WHERE title = 'Death at the Museum';

  -- Investigator
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    museum_mystery_id,
    'investigator',
    'You plagiarized Dr. Wells'' research early in your career to publish your **groundbreaking thesis**. You''ve lived in fear he''d discover the truth.',
    E'I was in the **archives room** reviewing ancient manuscripts for my upcoming lecture series.\n\nI was alone but the security cameras should show me there.'
  );

  -- Guilty
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    museum_mystery_id,
    'guilty',
    E'Dr. Wells discovered your entire career is built on **forgeries and falsified artifacts**. His new discovery would expose you as a fraud.\n\nYou poisoned his coffee with toxins extracted from the museum''s ancient Egyptian herb collection.',
    E'I was in the **restoration lab** working on ceramic repairs. I have detailed work logs from that evening.\n\nI only left when security called about the emergency.'
  );

  -- Innocent 1
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    museum_mystery_id,
    'innocent',
    'You''ve been **smuggling artifacts** to private collectors for years. Dr. Wells suspected, and you''re terrified his notes might reveal your crimes.',
    E'I was in the **geology wing** cataloging mineral specimens. It''s my monthly inventory night.\n\nThe night guard saw me working there.'
  );

  -- Innocent 2
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    museum_mystery_id,
    'innocent',
    'Dr. Wells was your **mentor and secret father**. He never publicly acknowledged you, but left you clues to prove your heritage after his death.',
    E'I was in the **break room** catching up on paperwork and eating dinner. I have timestamped emails I sent.\n\nI rushed over when I heard the alarm.'
  );

  -- Innocent 3
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    museum_mystery_id,
    'innocent',
    'You discovered evidence that Dr. Wells'' **newest artifact is a clever forgery**, but you''re afraid to speak up and ruin his legacy.',
    E'I was giving a **private tour** to a wealthy donor in the Renaissance wing. She can confirm I was with her.\n\nWe heard the commotion and went to investigate.'
  );
END $$;

-- Mystery 6: The Poisoned Playwright
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'The Poisoned Playwright',
  E'## The Crime\n\nCelebrated playwright Marcus Thorne collapsed during the opening night party of his controversial new play. Toxicology revealed **hemlock poisoning** in his champagne.\n\n## The Setting\n\nBackstage at the Royal Theatre. Five members of the production team had access to the champagne bottles.',
  ARRAY['review', 'performance', 'script'],
  ARRAY['plagiarism', 'original', 'stolen'],
  NULL
);

DO $$
DECLARE
  playwright_mystery_id UUID;
BEGIN
  SELECT id INTO playwright_mystery_id FROM mysteries WHERE title = 'The Poisoned Playwright';

  -- Investigator
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    playwright_mystery_id,
    'investigator',
    'You wrote a **devastating review** of Marcus''s previous play that nearly ended his career. Tonight was supposed to be your chance to apologize, but now it''s too late.',
    E'I was in the **audience** watching the performance from the critics'' section. My published notes show exactly what scenes I witnessed.\n\nI only went backstage after the curtain call.'
  );

  -- Guilty
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    playwright_mystery_id,
    'guilty',
    E'Marcus **stole your entire play** and published it as his own masterwork. You have the original manuscripts, but no one believed you.\n\nYou extracted hemlock from the theatre''s prop garden and added it to his celebration champagne.',
    E'I was in the **prop room** organizing items for tomorrow''s matinee. I always work during opening night parties.\n\nI didn''t even know he''d collapsed until later.'
  );

  -- Innocent 1
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    playwright_mystery_id,
    'innocent',
    'You''re Marcus''s **secret illegitimate child** who came to the show hoping he''d finally acknowledge you. You have his letters promising to reveal the truth tonight.',
    E'I was **on stage** performing in the play. Hundreds of people watched me deliver my lines.\n\nI was devastated when I heard what happened.'
  );

  -- Innocent 2
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    playwright_mystery_id,
    'innocent',
    'Marcus caught you **embezzling box office receipts**. He was going to fire you tonight after the performance.',
    E'I was in the **ticket booth** counting receipts and closing out the register. I have all the financial records.\n\nI was still there when the ambulance arrived.'
  );

  -- Innocent 3
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    playwright_mystery_id,
    'innocent',
    'You witnessed Marcus having a **violent confrontation** with someone earlier, but they threatened you to stay silent.',
    E'I was in the **wardrobe department** steaming costumes for tomorrow. I never left until I heard the screaming.\n\nI still can''t believe what happened.'
  );
END $$;

-- Mystery 7: Murder at the Masquerade
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'Murder at the Masquerade',
  E'## The Crime\n\nDuring the annual Venetian masquerade ball, socialite Isabella Rossini was found dead in the conservatory, strangled with her own silk scarf. Her mask remained in place.\n\n## The Setting\n\nA luxurious palazzo during carnival season. Five masked guests had been seen near the conservatory.',
  ARRAY['invitation', 'identity', 'rumor'],
  ARRAY['blackmail', 'secret', 'letter'],
  NULL
);

DO $$
DECLARE
  masquerade_mystery_id UUID;
BEGIN
  SELECT id INTO masquerade_mystery_id FROM mysteries WHERE title = 'Murder at the Masquerade';

  -- Investigator
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    masquerade_mystery_id,
    'investigator',
    'You weren''t actually **invited** to the masquerade—you forged your invitation to investigate corruption rumors about the host.',
    E'I was in the **ballroom** dancing with various partners throughout the evening. The nature of the masquerade makes it difficult to prove, but many saw my distinctive phoenix costume.\n\nI came to the conservatory when I heard the commotion.'
  );

  -- Guilty
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    masquerade_mystery_id,
    'guilty',
    E'Isabella was **blackmailing you** with letters proving you falsified your noble lineage. She demanded more money tonight.\n\nThe masks gave you the perfect cover—you lured her to the conservatory and silenced her forever.',
    E'I was in the **courtyard** by the fountain, enjoying the fresh air away from the crowd. My baroque harlequin costume should be memorable.\n\nI re-entered the palazzo through the west entrance.'
  );

  -- Innocent 1
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    masquerade_mystery_id,
    'innocent',
    'Isabella knew you were **spying for a rival family**. You''ve been feeding them business secrets for months.',
    E'I was in the **dining hall** sampling the elaborate buffet. I spoke with the chef about the menu at length.\n\nMy peacock costume was quite distinctive.'
  );

  -- Innocent 2
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    masquerade_mystery_id,
    'innocent',
    'You''re Isabella''s **secret lover**, meeting at these events under the anonymity of masks. Tonight she said she had something important to tell you.',
    E'I was in the **music room** listening to the string quartet. I requested several pieces and tipped the musicians.\n\nI wore a black cat costume with gold details.'
  );

  -- Innocent 3
  INSERT INTO character_sheets (mystery_id, role, dark_secret, alibi)
  VALUES (
    masquerade_mystery_id,
    'innocent',
    'You saw someone **following Isabella** toward the conservatory, but you can''t identify them because of their mask and costume.',
    E'I was in the **gallery** admiring the host''s art collection. The curator was showing me a new acquisition.\n\nMy white dove costume drew many compliments.'
  );
END $$;
