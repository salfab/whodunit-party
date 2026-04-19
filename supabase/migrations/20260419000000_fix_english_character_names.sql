-- Replace role-revealing placeholder names on the original English seed mysteries.
-- These rows were created before character_name existed, then filled with role names.

WITH name_fixes(title, role, secret_marker, character_name) AS (
  VALUES
    ('Murder at the Manor', 'investigator', 'gambled away your family fortune', 'Detective Inspector Grey'),
    ('Murder at the Manor', 'guilty', 'embezzling funds', 'Mr. Edmund Butler'),
    ('Murder at the Manor', 'innocent', 'passionate affair', 'Captain Whitmore'),
    ('Murder at the Manor', 'innocent', 'Renaissance painting', 'Lady Penelope Hart'),
    ('Murder at the Manor', 'innocent', 'witnessed the murder', 'Dr. Samuel Ashford'),

    ('Death at the Opera House', 'investigator', 'former opera critic', 'Inspector Laurent Dupont'),
    ('Death at the Opera House', 'guilty', 'original composition', 'Maestro Vincent Moreau'),
    ('Death at the Opera House', 'innocent', 'secret daughter', 'Marcel the Treasurer'),
    ('Death at the Opera House', 'innocent', 'sabotaging other performers', 'Madame Colette'),
    ('Death at the Opera House', 'innocent', 'corruption scandal', 'Henri the Tenor'),

    ('The Vanishing Heir', 'investigator', 'childhood tutor', 'Margaret Vale'),
    ('The Vanishing Heir', 'guilty', 'forging documents', 'Victor Beaumont'),
    ('The Vanishing Heir', 'innocent', 'illegitimate half-brother', 'Julien Montfort'),
    ('The Vanishing Heir', 'innocent', 'secret lover', 'Celeste Armand'),
    ('The Vanishing Heir', 'innocent', 'violent argument', 'Theo Renard'),

    ('Murder on the Orient Express', 'investigator', 'former detective', 'Inspector Elias Crane'),
    ('Murder on the Orient Express', 'guilty', 'destroyed your family', 'Silas Ward'),
    ('Murder on the Orient Express', 'innocent', 'stolen diamonds', 'Nadia Voss'),
    ('Murder on the Orient Express', 'innocent', 'arranged marriage', 'Clara Bellamy'),
    ('Murder on the Orient Express', 'innocent', 'sneaking toward Mr. Sterling', 'Otto Gruber'),

    ('Death at the Museum', 'investigator', 'groundbreaking thesis', 'Dr. Evelyn Price'),
    ('Death at the Museum', 'guilty', 'forgeries and falsified artifacts', 'Professor Lionel Graves'),
    ('Death at the Museum', 'innocent', 'smuggling artifacts', 'Amara Singh'),
    ('Death at the Museum', 'innocent', 'secret father', 'Daniel Wells'),
    ('Death at the Museum', 'innocent', 'clever forgery', 'Beatrice Lowell'),

    ('The Poisoned Playwright', 'investigator', 'devastating review', 'Cordelia Shaw'),
    ('The Poisoned Playwright', 'guilty', 'stole your entire play', 'Edwin March'),
    ('The Poisoned Playwright', 'innocent', 'secret illegitimate child', 'Lily Thorne'),
    ('The Poisoned Playwright', 'innocent', 'box office receipts', 'Frank Bell'),
    ('The Poisoned Playwright', 'innocent', 'violent confrontation', 'Miriam Vale'),

    ('Murder at the Masquerade', 'investigator', 'forged your invitation', 'Inspector Marco Bellini'),
    ('Murder at the Masquerade', 'guilty', 'blackmailing you', 'Count Luciano Verdi'),
    ('Murder at the Masquerade', 'innocent', 'rival family', 'Bianca Conti'),
    ('Murder at the Masquerade', 'innocent', 'secret lover', 'Sofia Loredan'),
    ('Murder at the Masquerade', 'innocent', 'following Isabella', 'Pietro Falco')
)
UPDATE character_sheets cs
SET character_name = nf.character_name
FROM mysteries m, name_fixes nf
WHERE cs.mystery_id = m.id
  AND m.title = nf.title
  AND COALESCE(m.language, 'en') = 'en'
  AND cs.role::text = nf.role
  AND cs.dark_secret ILIKE '%' || nf.secret_marker || '%'
  AND cs.character_name IN (
    'L''Enquêteur',
    'Le Coupable',
    'Un Innocent',
    'The Investigator',
    'The Guilty',
    'A Guilty',
    'A Culprit',
    'An Innocent',
    'A Suspect',
    'Innocent Suspect',
    'Guilty Suspect'
  );
