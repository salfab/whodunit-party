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

*Dans un bureau, on ne brûle pas des villes. On brûle la confiance.*', NULL, 'fr', 'Built-in', 'MACABRE', ARRAY['mug','pause','cuillère'], ARRAY['boîte','cendre','sachet'], '2025-12-25 08:39:47.051462+00')
ON CONFLICT (id) DO NOTHING;

-- Note: English mysteries (Murder at the Manor, Murder on the Orient Express, etc.)
-- are already seeded in 20241224000000_initial_schema.sql with character sheets

-- Note: Character sheets data is extensive (175 records)
-- Inserting in batches for better readability and maintenance
-- Each mystery has multiple character sheets (investigator, guilty, innocents)

-- Due to the large size of character sheet data (175 records with long text fields),
-- this seed includes only the mysteries.
-- Character sheets can be added through the admin interface or imported via bulk-create API.

COMMENT ON COLUMN mysteries.theme IS 'Theme categorization: PETTY_CRIME, MACABRE, SERIOUS_MURDER, FUNNY_CRIME';
