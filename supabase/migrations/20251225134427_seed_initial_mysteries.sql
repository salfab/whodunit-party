-- Seed initial mysteries for whodunit-party
-- This migration adds basic pre-built mysteries to ship with the application
-- Note: Many French mysteries are provided as ZIP files and will be auto-seeded through the upload API
-- This SQL seed contains only mysteries that don't exist as ZIP files

-- Note: Using ON CONFLICT DO NOTHING to make this migration idempotent
-- IDs are preserved from the original database for consistency

-- Insert mysteries
INSERT INTO mysteries (id, title, description, image_path, language, author, theme, innocent_words, guilty_words, created_at) VALUES
-- French mysteries (non-ZIP versions only)
('3a4b688b-3a29-4d26-8d3f-2ff66c6cd6a2', 'La ballade dérobée', '*Salle du trône. Tentures lourdes. Pupitre, encre, feuilles.*

Un ménestrel a plagié la ballade du royaume. Pas une "inspiration", pas un clin d''œil : des passages identiques, des images copiées, des silences au même endroit. Dans une cour, copier n''est pas seulement voler un texte : c''est voler une place, voler un prestige, voler l''oreille du roi. Et quand la cour vole, elle se rend ridicule — donc dangereuse.

Pour trancher sans torture ni devinette, j''impose une épreuve : **chacun raconte puis écrit** une histoire courte sur des thèmes imposés. Ce n''est pas le sujet qui m''intéresse, c''est la main : les tics, la cadence, les choix, les angles morts.

**Ce qui ne colle pas :**
- Un brouillon "trop perfait", sans rature, comme une copie recopiée.
- Un refrain qui revient avec une symétrie mécanique.
- Un encrier déplacé puis remis, comme si quelqu''un avait répété en cachette.

Je ne veux pas de grands discours de morale. **Je veux entendre vos voix réelles.** La main qui copie se trahira en cherchant la beauté au lieu de chercher la vérité.', NULL, 'fr', 'Built-in', 'PETTY_CRIME', ARRAY['pardon','message','minuscule'], ARRAY['refrain','couplets','plagiat'], '2025-12-25 08:39:26.886756+00'),
('baa8b7e2-9736-491c-98e8-94a32e71daea', 'La jambe de bois disparue', '## Mise en place
*Le petit musée sent la cire et le vieux papier. Les vitrines brillent trop, comme si quelqu''un avait voulu effacer la veille au soir.*

La pièce maîtresse de l''exposition — **la jambe de bois du capitaine Armand "Trois-Tempêtes"** — a disparu de sa vitrine. Pas un objet de grande valeur marchande, non : une relique locale, un symbole. Et c''est précisément pour ça que l''absence fait plus de bruit qu''un vol de bijoux.

## Ce qui ne colle pas
- *La vitrine est intacte*, mais la serrure a une micro-rayure fraîche.
- Le cartel (l''étiquette explicative) a été **remplacé** : même texte, mais une faute nouvelle et une police légèrement différente.
- Dans l''atelier de conservation, il manque un flacon de **vernis** et un chiffon "propre" est étrangement humide.
- Un visiteur a signalé une odeur de **térébenthine** près du placard des réserves, à une heure où personne ne devrait y être.

## Ce que je veux
Je veux comprendre si on a **volé** la jambe… ou si on l''a **cachée** pour masquer autre chose : une casse, une substitution, une honte.

*Je n''ai pas besoin d''un grand coupable tragique. Je veux la main précise qui a déplacé l''objet, et le mensonge qui l''a accompagné.*', NULL, 'fr', 'Built-in', 'PETTY_CRIME', ARRAY['vitrine','patine','inventaire'], ARRAY['restauration','vernis','réserve'], '2025-12-25 08:39:36.315328+00'),
('0dbe9c38-2f18-49be-b859-9c06d2bd1165', 'Le hamster en peluche', '## Mise en place
*Dans la salle de jeux, la lumière est trop blanche et les rires ont disparu. Les enfants chuchotent comme si le sol pouvait les dénoncer.*

Le hamster en peluche — la mascotte du centre, **"Moustache"**, celui qu''on embrasse quand on a peur et qu''on serre quand on se dispute — a été retrouvé éventré. Pas une déchirure gentille : la couture est ouverte proprement, et une partie du rembourrage manque. Le plus étrange : on a recousu un coin… au mauvais fil, comme une tentative précipitée de faire croire à un accident.

## Ce qui ne colle pas
- La paire de ciseaux de bricolage a été **rangée**, mais il manque la protection en plastique.
- Une traînée de micro-fibres mène jusqu''au placard des déguisements.
- Un sachet de paillettes est ouvert, et il y en a dans des endroits absurdes, comme si quelqu''un avait manipulé les deux à la fois.

## Ce que je veux
Je veux savoir si quelqu''un a "tué" Moustache pour une farce… ou si cette peluche a servi à **cacher une autre manœuvre** : récupérer du rembourrage, couvrir une erreur, ou détourner l''attention d''un incident plus embarrassant.

*On ne juge pas l''émotion des enfants. On juge le geste de l''adulte (ou l''imitation très organisée d''un geste d''adulte).*', NULL, 'fr', 'Built-in', 'PETTY_CRIME', ARRAY['doudou','graines','câlin'], ARRAY['rembourrage','ciseaux','paillettes'], '2025-12-25 08:39:36.366728+00'),
('e5fae132-cbfe-4f20-898b-fdda5f576212', 'Le parapheur inversé (SwissCaution)', '## Mise en place
*Open space feutré, écrans bleus, claviers qui claquent. Un calme de bureau qui ne tient que parce que personne ne regarde trop longtemps la même feuille.*

Chez **SwissCaution**, un incident a fait trembler la chaîne de validation : le **parapheur** des contrats "sensibles" a été retrouvé **inversé**. Les dossiers sont à l''envers, les intercalaires ne correspondent plus, et plusieurs documents ont reçu le mauvais tampon. Ce n''est pas une catastrophe spectaculaire, c''est pire : c''est une erreur silencieuse qui peut coûter cher, qui peut annuler un accord, ou créer un litige absurde.

## Ce qui ne colle pas
- Un set de post-it avec des flèches "↑↓" a disparu du bureau de l''Ops.
- La scan-room a une numérisation effectuée à une heure inhabituelle, sans ticket de demande.
- Une page de "checklist" a été remplacée : même titre, mais cases légèrement décalées, comme une copie refaite.

## Ce que je veux
Je veux comprendre si c''est une erreur humaine, une tentative de sabotage, ou une manœuvre pour **retarder** un dossier précis.

*Dans un bureau, le mensonge n''a pas besoin de cris. Il suffit d''un onglet au mauvais endroit.*', NULL, 'fr', 'Built-in', 'PETTY_CRIME', ARRAY['dossier','tampon','scan'], ARRAY['onglet','renversé','signature'], '2025-12-25 08:39:36.403531+00'),
('0ac88d1a-e8f3-4711-85f3-2b4b987fe400', 'Le bocal de doigts & la confiture', '## Mise en place
*Fête de village, guirlandes, odeur de sucre chaud. On s''attend à des tartines, pas à un silence.*

Au concours de confiture, un bocal a été posé sur la table d''honneur : étiquette parfaite, ruban bien noué… et à l''intérieur, des **"doigts"**. Pas du sang, pas une scène de crime : des formes incroyablement réalistes, pâles, comme des doigts en pâte d''amande, plongés dans une gelée rouge sombre. Le public a crié, puis ri, puis a cessé de rire quand on a compris que ce bocal avait remplacé celui d''une candidate en lice pour le trophée.

## Ce qui ne colle pas
- Une odeur nette d''**amande** flotte autour de la table, alors que personne n''a présenté de recette à l''amande.
- L''étiquette est imprimée sur un papier légèrement différent : même design, mais texture plus lisse.
- Un trophée a été déplacé de quelques centimètres, comme si quelqu''un avait répété la scène.

## Ce que je veux
Je veux savoir qui a monté ce numéro macabre pour humilier… et si ce "bocal" était surtout un prétexte pour **voler, remplacer, ou faire disparaître** la vraie confiture gagnante.

*Ce n''est pas seulement une farce. C''est une main qui veut tenir le récit.*', NULL, 'fr', 'Built-in', 'MACABRE', ARRAY['confiture','étiquette','concours'], ARRAY['amande','colorant','trophée'], '2025-12-25 08:39:36.437716+00'),
('387f85d0-298c-4608-aa08-3637f53f0044', 'Les cendres au cacao', '## Mise en place
*Salle de pause. Machine à café épuisée, néons trop blancs, petites cuillères qui tintent comme des alibis.*

Quelqu''un a remplacé le cacao en poudre du placard commun par une substance grise, fine, qui ressemble à des **cendres**. Le premier mug a déclenché une grimace, le deuxième un gag nerveux, le troisième une colère. Puis l''odeur s''est imposée : pas du chocolat, mais une note sèche de cheminée froide. Au bureau, ce genre de sabotage ne fait pas de blessés… il fait pire : il fait douter. Tout le monde boit, tout le monde accuse, tout le monde se demande depuis quand on peut empoisonner une pause.

## Ce qui ne colle pas
- La boîte de cacao est la bonne, mais le couvercle ferme "un peu trop bien", comme s''il avait été échangé.
- Un sachet de cacao premium (réservé aux "jours spéciaux") a disparu du stock interne.
- Une cuillère porte une poussière grise alors que les autres sont propres.
- Une micro-trace de poudre grise est retrouvée *à l''extérieur du placard*, comme si on avait versé en marchant.

## Ce que je veux
Je veux savoir qui a mis des cendres là où on attendait du réconfort… et si ce scandale servait surtout à détourner le vrai cacao.

*Dans un bureau, on ne brûle pas des villes. On brûle la confiance.*', NULL, 'fr', 'Built-in', 'MACABRE', ARRAY['mug','pause','cuillère'], ARRAY['boîte','cendre','sachet'], '2025-12-25 08:39:47.051462+00'),
('7e153ee0-f1da-402a-a890-af7e340a63d7', 'La lunette relevée', '## Mise en place
*Couloir de bureau, porte des toilettes, désodorisant trop agressif. On peut mesurer la civilisation à la hauteur d''une lunette.*

Quelqu''un a encore laissé la lunette relevée. Et pas une fois. Pas "par inadvertance". De manière répétée, au point que la moitié de l''équipe a développé une paranoïa hydrophobe. Dans un bureau, ce n''est pas un crime sanguinolent. C''est un crime de **guerre psychologique** : un petit acte qui déclenche des grandes rancunes.

## Ce qui ne colle pas
- Le panneau "Merci de laisser les lieux propres" a été déplacé puis remis, mais de travers.
- Une trace d''eau mène du lavabo vers la porte… puis revient, comme un aller-retour précipité.
- Un rouleau de papier a été remplacé par un modèle différent : même largeur, texture autre.
- Un gel hydroalcoolique a été déplacé de 30 centimètres, comme si quelqu''un voulait forcer un geste.

## Ce que je veux
Je veux savoir si c''est une provocation ciblée, un "test" social, ou une diversion pour couvrir autre chose (un objet pris, un message lu, un placard ouvert).

*On ne sous-estime jamais l''absurde : l''absurde est souvent un masque très pratique.*', NULL, 'fr', 'Built-in', 'FUNNY_CRIME', ARRAY['lavabo','désodorisant','papier'], ARRAY['cuvette','panneau','provocation'], '2025-12-25 08:39:47.231393+00'),

-- English mysteries
('6aab8357-18ee-4f1f-a004-2e8ebf1b9777', 'Murder at the Manor', '## The Crime

Lord Blackwood was found dead in his study at midnight, poisoned by arsenic in his evening brandy. The doors were locked from the inside, and only five guests had access to the study that evening.

## Your Mission

As the investigator, you must question each guest, listen for their alibis, and determine who among them is guilty. Each person has secrets to hide, but only one is the murderer.', NULL, 'en', 'Built-in', 'SERIOUS_MURDER', ARRAY['manuscript','inheritance','betrayal'], ARRAY['ledger','poison','desperate'], '2025-12-24 22:58:10.721318+00'),
('5fadc3f6-8391-4385-8cb5-dc784c2c6e95', 'Murder on the Orient Express', '## The Crime

Wealthy industrialist Mr. Sterling was found stabbed twelve times in his locked compartment on the luxury train. The murder occurred somewhere between Paris and Vienna.

## The Setting

Aboard the famous Orient Express. Five passengers in the adjacent compartments are suspects.', NULL, 'en', 'Built-in', 'SERIOUS_MURDER', ARRAY['journey','business','destination'], ARRAY['account','evidence','mistake'], '2025-12-24 22:58:10.721318+00'),
('6344f6a7-77ec-424d-8b85-0228b1153323', 'Murder at the Masquerade', '## The Crime

During the annual Venetian masquerade ball, socialite Isabella Rossini was found dead in the conservatory, strangled with her own silk scarf. Her mask remained in place.

## The Setting

A luxurious palazzo during carnival season. Five masked guests had been seen near the conservatory.', NULL, 'en', 'Built-in', 'SERIOUS_MURDER', ARRAY['invitation','identity','rumor'], ARRAY['blackmail','secret','letter'], '2025-12-24 22:58:10.721318+00'),
('0ff456b3-ff9e-426d-9d49-b4d6639424d5', 'The Poisoned Playwright', '## The Crime

Celebrated playwright Marcus Thorne collapsed during the opening night party of his controversial new play. Toxicology revealed **hemlock poisoning** in his champagne.

## The Setting

Backstage at the Royal Theatre. Five members of the production team had access to the champagne bottles.', NULL, 'en', 'Built-in', 'SERIOUS_MURDER', ARRAY['review','performance','script'], ARRAY['plagiarism','original','stolen'], '2025-12-24 22:58:10.721318+00'),
('a1b9c8b2-b67c-41e5-8f01-9c7a41d0f554', 'The Vanishing Heir', '## The Crime

Young heir Alexandre Montfort was found dead in the wine cellar of his family château, strangled with a silk cravat. He was supposed to announce his engagement at tonight''s gala.

## The Setting

A grand château in the French countryside. Five family members and associates had the opportunity to reach the wine cellar during the evening reception.', NULL, 'en', 'Built-in', 'SERIOUS_MURDER', ARRAY['inheritance','wedding','fortune'], ARRAY['debt','conspiracy','desperation'], '2025-12-24 22:58:10.721318+00'),
('bde37d2a-2b4f-44fb-a5ea-914bcc76d4ba', 'Death at the Museum', '## The Crime

Renowned archaeologist Dr. Harrison Wells was found dead in the Egyptian wing, poisoned by a **rare toxin** derived from ancient herbs. His latest discovery was about to be unveiled.

## The Setting

The Metropolitan Museum after hours. Five colleagues had special access to the restricted exhibition.', NULL, 'en', 'Built-in', 'SERIOUS_MURDER', ARRAY['discovery','authentic','recognition'], ARRAY['forgery','expose','career'], '2025-12-24 22:58:10.721318+00'),
('d0f32221-3c29-4454-9114-8a4548ec242a', 'Death at the Opera House', '## The Crime

Diva Valentina Rose collapsed on stage during the final act of *La Traviata*. The autopsy revealed **cyanide poisoning** in her makeup.

## The Setting

Backstage at the Grand Opera House. Five people had access to her dressing room in the hour before her death.', NULL, 'en', 'Built-in', 'SERIOUS_MURDER', ARRAY['reputation','expose','truth'], ARRAY['composition','revenge','justice'], '2025-12-24 22:58:10.721318+00')
ON CONFLICT (id) DO NOTHING;

-- Note: Character sheets data is extensive (175 records)
-- Inserting in batches for better readability and maintenance
-- Each mystery has multiple character sheets (investigator, guilty, innocents)

-- Due to the large size of character sheet data (175 records with long text fields),
-- this seed includes only the mysteries.
-- Character sheets can be added through the admin interface or imported via bulk-create API.

COMMENT ON COLUMN mysteries.theme IS 'Theme categorization: PETTY_CRIME, MACABRE, SERIOUS_MURDER, FUNNY_CRIME';
