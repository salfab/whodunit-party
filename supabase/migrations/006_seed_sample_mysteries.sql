-- Seed initial mysteries with character sheets
-- This creates two sample mysteries: "Murder at the Manor" and "Death at the Opera House"

-- Mystery 1: Murder at the Manor
INSERT INTO mysteries (title, description, innocent_words, guilty_words, image_path)
VALUES (
  'Murder at the Manor',
  E'## The Crime\n\nLord Blackwood was found dead in his study at midnight, poisoned by arsenic in his evening brandy. The doors were locked from the inside, and only five guests had access to the study that evening.\n\n## Your Mission\n\nAs the investigator, you must question each guest, listen for their alibis, and determine who among them is guilty. Each person has secrets to hide, but only one is the murderer.',
  ARRAY['manuscript', 'inheritance', 'betrayal'],
  ARRAY['ledger', 'poison', 'desperate'],
  NULL
) RETURNING id;

-- Get the mystery ID for character sheets
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
