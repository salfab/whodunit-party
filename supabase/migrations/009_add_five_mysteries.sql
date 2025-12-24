-- Add 5 new mysteries to the database

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
