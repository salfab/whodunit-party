-- The original English-title seed mysteries were later marked as fr by the
-- language migration, so fix them by title and sheet content instead.

WITH name_fixes(title, secret_marker, character_name) AS (
  VALUES
    ('Murder at the Manor', 'gambled away your family fortune', 'Detective Inspector Grey'),
    ('Murder at the Manor', 'embezzling funds', 'Mr. Edmund Butler'),
    ('Murder at the Manor', 'passionate affair', 'Captain Whitmore'),
    ('Murder at the Manor', 'Renaissance painting', 'Lady Penelope Hart'),
    ('Murder at the Manor', 'witnessed the murder', 'Dr. Samuel Ashford'),

    ('Death at the Opera House', 'former opera critic', 'Inspector Laurent Dupont'),
    ('Death at the Opera House', 'original composition', 'Maestro Vincent Moreau'),
    ('Death at the Opera House', 'secret daughter', 'Marcel the Treasurer'),
    ('Death at the Opera House', 'sabotaging other performers', 'Madame Colette'),
    ('Death at the Opera House', 'corruption scandal', 'Henri the Tenor'),

    ('The Vanishing Heir', 'childhood tutor', 'Margaret Vale'),
    ('The Vanishing Heir', 'forging documents', 'Victor Beaumont'),
    ('The Vanishing Heir', 'illegitimate half-brother', 'Julien Montfort'),
    ('The Vanishing Heir', 'secret lover', 'Celeste Armand'),
    ('The Vanishing Heir', 'violent argument', 'Theo Renard'),

    ('Murder on the Orient Express', 'former detective', 'Inspector Elias Crane'),
    ('Murder on the Orient Express', 'destroyed your family', 'Silas Ward'),
    ('Murder on the Orient Express', 'stolen diamonds', 'Nadia Voss'),
    ('Murder on the Orient Express', 'arranged marriage', 'Clara Bellamy'),
    ('Murder on the Orient Express', 'sneaking toward Mr. Sterling', 'Otto Gruber'),

    ('Death at the Museum', 'groundbreaking thesis', 'Dr. Evelyn Price'),
    ('Death at the Museum', 'forgeries and falsified artifacts', 'Professor Lionel Graves'),
    ('Death at the Museum', 'smuggling artifacts', 'Amara Singh'),
    ('Death at the Museum', 'secret father', 'Daniel Wells'),
    ('Death at the Museum', 'clever forgery', 'Beatrice Lowell'),

    ('The Poisoned Playwright', 'devastating review', 'Cordelia Shaw'),
    ('The Poisoned Playwright', 'stole your entire play', 'Edwin March'),
    ('The Poisoned Playwright', 'secret illegitimate child', 'Lily Thorne'),
    ('The Poisoned Playwright', 'box office receipts', 'Frank Bell'),
    ('The Poisoned Playwright', 'violent confrontation', 'Miriam Vale'),

    ('Murder at the Masquerade', 'forged your invitation', 'Inspector Marco Bellini'),
    ('Murder at the Masquerade', 'blackmailing you', 'Count Luciano Verdi'),
    ('Murder at the Masquerade', 'rival family', 'Bianca Conti'),
    ('Murder at the Masquerade', 'secret lover', 'Sofia Loredan'),
    ('Murder at the Masquerade', 'following Isabella', 'Pietro Falco')
)
UPDATE character_sheets cs
SET character_name = nf.character_name
FROM mysteries m, name_fixes nf
WHERE cs.mystery_id = m.id
  AND m.title = nf.title
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
