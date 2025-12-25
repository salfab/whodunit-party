-- Seed initial mysteries and character sheets for whodunit-party
-- This migration adds 25 pre-built mysteries to ship with the application

-- Note: Using ON CONFLICT DO NOTHING to make this migration idempotent
-- IDs are preserved from the original database for consistency

-- Insert mysteries
INSERT INTO mysteries (id, title, description, image_path, language, author, theme, innocent_words, guilty_words, created_at) VALUES
-- French mysteries
('818ad970-19b8-4403-bc62-960c194a6042', 'Le "nez" ocarina de Pinocchio', '*Je pousse la porte de l''atelier comme on entrouvre un secret.*

Le "nez" de Pinocchio a été transformé en ocarina : une rangée de trous nets, réguliers, impossibles à confondre avec un accident. Le pire, c''est la mise en scène : l''instrument est posé sur un coussin, éclairé par une lampe d''établi, comme une œuvre à admirer. Ce soir, la troupe joue devant une salle pleine, et le "nez" est l''accessoire vedette. Sans lui, le numéro tombe à plat. Avec lui, chaque mensonge devient un sifflement ridicule.

**Ce qui ne colle pas :**
- La poussière de bois est *trop fine* et rassemblée en tas, comme si quelqu''un avait balayé pour ne laisser que le "beau" copeau.
- Une partition est maculée de vernis, et un schéma de trous y apparaît en filigrane.
- La boîte d''outils est refermée "trop proprement" : même les maniaques laissent une trace de précipitation.

Je ne veux pas de théâtre dans le théâtre. **On dit ce qu''on sait, et on assume ce qu''on a fait.**

Et je le rappelle : quand vous dites "nez", vous faites tous les guillemets avec les doigts.', NULL, 'fr', 'Built-in', 'PETTY_CRIME', ARRAY['atelier','copeaux','marionnette'], ARRAY['ocarina','mèche','vernis'], '2025-12-25 08:39:26.759163+00'),
('35fcf48b-59e0-48f4-a24d-a1beb6af469e', 'Rital sous ritaline', '*Naples, petite pâtisserie, vitrine lumineuse et arrière-boutique trop étroite.*

Gianni, rouleur de cannoli, a été retrouvé effondré derrière la cuisine. Son visage contre un sac de sucre, comme si la douceur l''avait trahi. Dans sa poche : une plaquette vide de ritaline, froissée. Sur la table : une tasse d''espresso à moitié bue, et un carnet de commandes dont une page a été arrachée. Dans cette boutique, tout le monde connaît tout le monde. Alors, quand quelque chose déraille, ce n''est pas un hasard : c''est une habitude qui a dépassé une limite.

**Ce qui ne colle pas :**
- Un moulin à poivre qui porte une fine poussière blanche, au mauvais endroit, au mauvais moment.
- Un tiroir de caisse ouvert puis refermé sans ticket, comme un geste de panique.
- Une serviette roulée serré, trop serrée, comme un petit paquet à cacher.

Je ne veux pas de chronologie scolaire ni de calculs : je veux comprendre le *climat*. Qui a poussé Gianni à se mettre en danger, et qui a profité du désordre pour effacer une preuve, un nom, une dette ?', NULL, 'fr', 'Built-in', 'SERIOUS_MURDER', ARRAY['cannoli','espresso','nappe'], ARRAY['blister','moulin','recette'], '2025-12-25 08:39:26.824679+00'),
('b5cda1e1-db9f-4bfe-ae53-e688e3072668', 'La perruque de Kojak dans la soupe', '*La cantine est vide, mais la honte, elle, occupe toutes les tables.*

La perruque de Kojak a trempé dans la soupe du midi. Pas un accident de plateau, pas un courant d''air, pas une chute "malheureuse". Trempée, insistée, laissée assez longtemps pour que la laine prenne le bouillon. Résultat : la salle a ri, puis s''est tue, puis s''est divisée. À l''Amicale des gens qui ont un cheveu sur la langue, l''humiliation n''est jamais gratuite : elle sert souvent à couvrir un autre geste, plus discret, plus rentable.

**Ce qui ne colle pas :**
- La marmite a été déplacée de vingt centimètres : juste assez pour qu''un coude "accidentel" devienne plausible.
- Une pince de service a été rangée au mauvais crochet, comme si quelqu''un avait voulu gagner du temps.
- Une serviette en papier porte une note griffonnée, puis froissée : trois mots, comme un mini-plan.

Je ne veux pas de morale, je veux une responsabilité. **On arrête de se cacher derrière le rire.** Je veux savoir qui a trempé… et ce que cette farce camouflait.', NULL, 'fr', 'Built-in', 'FUNNY_CRIME', ARRAY['cantine','plateau','louche'], ARRAY['perruque','bouillon','pince'], '2025-12-25 08:39:26.794468+00'),
('bbbe4d42-11cc-497f-ad5d-14ef8f91f1a7', 'Un vin qui a du corps', '*La cave est fraîche, mais l''air est lourd, comme si le bois retenait sa respiration.*

Le vigneron **Stu Pedassow**, surnommé parfois **Stu Pedazo** par ceux qui veulent faire les malins, a été retrouvé flottant dans une barrique. Noyé dans son propre vin. Ce n''est pas seulement macabre : c''est symbolique, presque théâtral. Le couvercle a été reposé, la bonde essuyée. Quelqu''un a voulu que cela ressemble à une fatalité, pas à une décision.

**Ce qui ne colle pas :**
- Une trace de pas s''arrête net devant la barrique, puis repart en arrière, comme un moment d''hésitation.
- Un bouchon "étranger" est planté sur un tire-bouchon : il ne correspond à aucune bouteille ouverte au domaine.
- Une page du carnet de cave a été arrachée proprement, comme si la preuve était plus dangereuse que la mort.

Je ne cherche pas un calcul parfait, je cherche une peur parfaite : celle qui pousse à effacer un papier, à voler une clé, à contrôler un récit. **Qui avait intérêt à ce que Stu se taise, et qu''est-ce qu''il gardait sur lui ?**', NULL, 'fr', 'Built-in', 'MACABRE', ARRAY['barrique','cave','vendange'], ARRAY['soutirage','entonnoir','bonde'], '2025-12-25 08:39:26.857572+00'),
('3a4b688b-3a29-4d26-8d3f-2ff66c6cd6a2', 'La ballade dérobée', '*Salle du trône. Tentures lourdes. Pupitre, encre, feuilles.*

Un ménestrel a plagié la ballade du royaume. Pas une "inspiration", pas un clin d''œil : des passages identiques, des images copiées, des silences au même endroit. Dans une cour, copier n''est pas seulement voler un texte : c''est voler une place, voler un prestige, voler l''oreille du roi. Et quand la cour vole, elle se rend ridicule — donc dangereuse.

Pour trancher sans torture ni devinette, j''impose une épreuve : **chacun raconte puis écrit** une histoire courte sur des thèmes imposés. Ce n''est pas le sujet qui m''intéresse, c''est la main : les tics, la cadence, les choix, les angles morts.

**Ce qui ne colle pas :**
- Un brouillon "trop parfait", sans rature, comme une copie recopiée.
- Un refrain qui revient avec une symétrie mécanique.
- Un encrier déplacé puis remis, comme si quelqu''un avait répété en cachette.

Je ne veux pas de grands discours de morale. **Je veux entendre vos voix réelles.** La main qui copie se trahira en cherchant la beauté au lieu de chercher la vérité.', NULL, 'fr', 'Built-in', 'PETTY_CRIME', ARRAY['pardon','message','minuscule'], ARRAY['refrain','couplets','plagiat'], '2025-12-25 08:39:26.886756+00'),
('6e504d48-ec34-40f5-a51f-06adee3130da', 'Le Conclave au jus rouge', '*Salon funéraire, rideaux de velours, miroirs couverts. La lune découpe la pièce en bandes froides.*

Je suis inspecteur, et je suis vampire. Ce qui veut dire que je connais vos serments, vos menaces polies, vos silences millénaires. Et ce soir, le Conclave tremble pour une raison absurde et terrifiante : l''un de vous est **secrètement vegan**. Dans ce cercle, ce n''est pas un régime : c''est une humiliation potentiellement mortelle. On pardonne un duel. On pardonne rarement le ridicule.

**Ce qui ne colle pas :**
- Une carafe de "jus rouge" trop opaque, qui ne ressemble pas à nos usages.
- Une tache sèche en forme de feuille sur une serviette, comme un symbole involontaire.
- Une odeur d''épices (cumin, quelque chose de terreux) près de la salle des familiers.

Personne n''avoue spontanément ici. Alors je cherche le détail concret : qui parle de discipline comme d''un alibi, qui évite le mot "appétit", qui connaît trop bien une recette. **Fini les demi-vérités.** Je veux le nom du vampire qui se cache… et je veux comprendre ce que cette dissimulation a déclenché dans l''ombre.', NULL, 'fr', 'Built-in', 'FUNNY_CRIME', ARRAY['calice','velours','minuit'], ARRAY['betterave','blender','marinade'], '2025-12-25 08:39:26.917955+00'),
('8c6ace26-a349-4b1a-bbd3-d7801091b8c1', 'La fausse bombe du Nouvel An', '*La rue ne ressemble plus à une rue : pavés noircis, vitrines éclatées, fumée qui s''accroche aux balcons comme une mauvaise idée. Les sirènes font un bruit continu.*

Ce qui devait être une célébration s''est transformé en chaos : une caisse prévue pour un effet de scène du réveillon a été remplacée par un colis de chantier. La panique a fait le reste : blessés, foule qui court, rumeurs qui se propagent plus vite que les faits. Dans ce désordre, une chose est certaine : quelqu''un a profité du brouillard, soit par négligence criminelle, soit par opportunisme.

**Ce qui ne colle pas :**
- Une étiquette recollée de travers sur une caisse du dépôt municipal, comme si quelqu''un avait renommé un contenu sans regarder.
- Une page arrachée d''un carnet de livraison : pas déchirée à la va-vite, arrachée proprement.
- Un ruban de scène brûlé retrouvé loin de la zone prévue, comme s''il avait été déplacé pour créer une fausse piste.

Je ne veux pas de discours sur "l''accident" tant qu''on n''a pas compris qui a déplacé, qui a recollé, qui a effacé. **On met tout à plat.** Qui a mis la mauvaise caisse au mauvais endroit… et qu''est-ce que ce chaos a permis de cacher ?', NULL, 'fr', 'Built-in', 'SERIOUS_MURDER', ARRAY['réveillon','sirène','confettis'], ARRAY['chantier','caisse','TNT'], '2025-12-25 08:39:26.947731+00'),
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
*Salle de pause. Machine à café fatiguée. Odeur sucrée… et un arrière-goût de cheminée froide.*

Quelqu''un a remplacé le cacao en poudre du placard commun par une substance grise, fine, qui ressemble à des **cendres**. Résultat immédiat : mugs jetés, collègues écœurés, rumeurs qui gonflent. Certains jurent que ça vient d''une urne funéraire oubliée, d''autres parlent d''une blague morbide, et l''ambiance du bureau devient électrique. Ce n''est pas un meurtre, mais c''est un poison social parfait : tout le monde boit, tout le monde doute, tout le monde accuse.

## Ce qui ne colle pas
- La boîte de cacao est la bonne… mais le couvercle ferme "un peu trop bien", comme si on l''avait changé.
- Un sachet de cacao premium a disparu du stock interne, celui qu''on sortait "pour les jours spéciaux".
- Sur l''étagère, une cuillère porte une poussière grise alors que les autres sont propres.

## Ce que je veux
Je veux savoir qui a mis des cendres là où on attendait du réconfort… et si cette horreur douce servait surtout à **détourner** le vrai cacao.

*Dans un bureau, on ne brûle pas des villes. On brûle la confiance.*', NULL, 'fr', 'Built-in', 'MACABRE', ARRAY['mug','pause','cuillère'], ARRAY['boîte','cendre','sachet'], '2025-12-25 08:39:36.469791+00'),
('2e2bbcdb-4160-457b-8a31-fda5edf8914a', 'Les cendres au cacao', '## Mise en place
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
('53e83201-16de-4df8-9d22-b97b9bd9a212', 'Qui a poussé Mémé dans les ortilles ?', '## Mise en place
*Jardin de potager, allée de gravier, odeur de terre et de soupe au poireau. Le genre d''endroit où les drames ont l''air ridicules… jusqu''à ce qu''ils deviennent réels.*

Mémé Odette a été retrouvée **dans les orties**, furieuse, piquée de partout, mais vivante. Ce n''est pas un meurtre : c''est un scandale familial version slapstick. Sauf que Mémé jure qu''on l''a **poussée**. Et quand Mémé jure, la famille tremble : elle a une mémoire d''éléphant et une rancune de titan.

## Ce qui ne colle pas
- Une canne est retrouvée **posée** sur le banc, pas tombée dans l''herbe.
- Une trace de pas glisse sur le gravier puis s''arrête net, comme une hésitation.
- Le panier de légumes de Mémé a été "rangé" trop proprement dans la remise.
- Un pot de pommade anti-démangeaison a disparu… et réapparaît vide dans la poubelle.

## Ce que je veux
Je veux savoir qui a envoyé Mémé dans les orties, et si c''était une maladresse, une vengeance, ou une diversion pour autre chose (un objet caché, un papier subtilisé, une dispute évitée).

*Ici, le ridicule est une arme. Et Mémé ne pardonne pas les armes.*', NULL, 'fr', 'Built-in', 'FUNNY_CRIME', ARRAY['potager','canne','piqûre'], ARRAY['banc','remise','pommade'], '2025-12-25 08:39:47.092942+00'),
('fe369739-9fce-4e8a-8ea6-adf4f933f025', 'La poudre de Perimpimpin à sec', '## Mise en place
*Au royaume des fées et des magiciens, les fontaines chantent d''habitude. Aujourd''hui, elles toussent.*

La réserve royale de **poudre de Perimpimpin** est vide. Pas "en baisse". Vide : des étagères propres, des flacons retournés, et une odeur d''étoiles froides qui traîne. Dans ce royaume, la poudre est le consommable le plus précieux : elle soigne, elle répare, elle illumine, elle sauve des sorts ratés. Sans elle, les baguettes crachotent, les ailes perdent leur éclat, et les pactes magiques commencent à se défaire.

## Ce qui ne colle pas
- Le sceau du coffre est intact, mais la cire a une micro-fissure, comme si on l''avait chauffée puis refroidie.
- Une plume de fée est coincée dans la charnière intérieure, impossible sans ouverture.
- Un registre d''inventaire présente une ligne copiée deux fois, comme une tentative de masquer une soustraction.

## Ce que je veux
Je veux savoir qui a dévalisé la poudre… et pourquoi : besoin d''un sort, marché noir, sabotage, ou panique.

*Dans un royaume magique, la pénurie n''est jamais juste une pénurie. C''est une déclaration.*', NULL, 'fr', 'Built-in', 'PETTY_CRIME', ARRAY['grimoire','sceau','lueur'], ARRAY['flacon','pénurie','marché'], '2025-12-25 08:39:47.128951+00'),
('d2df025b-7bd6-4071-8dda-3cdf794775b4', 'Qui a condamné la sortie de la mine alors qu''il y avait trois nains dedans ?', '## Mise en place
"Alors, c''est trois nains qui sont dans une mine." 

*Je vous laisse une seconde : ça commence comme une blague, et ça finit comme une nuit qu''on n''oublie pas.*

"Et là, c''est le drame." 

La sortie de la mine a été **condamnée** de l''extérieur alors que trois nains se trouvaient encore dedans. Pas un éboulement naturel : une grille abaissée, un verrou enclenché, un mécanisme sécurisé comme quelqu''un qui veut empêcher *délibérément* une sortie. Les trois nains ont survécu grâce à une galerie secondaire, mais la communauté est en furie. Dans une mine, fermer une porte n''est pas un geste : c''est une sentence.

## Ce qui ne colle pas
- Le levier de fermeture porte une trace de graisse fraîche, différente de celle de l''équipe.
- Une lanterne est retrouvée dehors, alors qu''elle aurait dû être rentrée.
- Le registre des allées et venues a un trou : une heure entière sans signature.

## Ce que je veux
Je veux la main qui a condamné la sortie. Était-ce une vengeance, une panique, une tentative de cacher quelque chose dans la mine, ou un acte "pour leur bien" qui a dégénéré ?

*On ne ferme pas une mine sur des gens par accident. Pas comme ça.*', NULL, 'fr', 'Built-in', 'SERIOUS_MURDER', ARRAY['galerie','lanterne','levier'], ARRAY['grille','verrou','silence'], '2025-12-25 08:39:47.165899+00'),
('f7952403-03cb-46cf-a1d2-f6914c1d8f4b', 'L''internat : Frosties remplacés par Smacks', '## Mise en place
*Réfectoire d''internat, matin trop tôt, chaises qui grincent. Le garde-manger est le cœur du royaume.*

Le drame est simple et sacrilège : quelqu''un a remplacé les **Frosties** par des **Smacks** dans le garde-manger de l''internat. Pas juste "mettre à côté". Remplacer : verser, transvaser, camoufler. Résultat : émeute miniature, cris, alliances, trahisons. Ici, les céréales sont une monnaie. Toucher aux céréales, c''est toucher au pouvoir.

## Ce qui ne colle pas
- Le carton des Frosties a une ouverture recollée avec un scotch différent.
- Une poudre de sucre est retrouvée sur le dessus d''une boîte qui ne devrait pas en avoir.
- Une fiche d''inventaire a été "corrigée" au stylo, puis repassée au feutre.
- Un élève affirme avoir vu une silhouette avec un sac de sport près du garde-manger, mais personne ne veut être le "balance".

## Ce que je veux
Je veux la main qui a fait le swap. Était-ce une vengeance, un prank, une punition, ou une opération de troc : on a "pris" les Frosties pour les revendre, et on a laissé des Smacks pour éviter le constat.

*Dans un internat, le crime n''est pas grand. Mais la politique, si.*', NULL, 'fr', 'Built-in', 'FUNNY_CRIME', ARRAY['réfectoire','garde-manger','cuillère'], ARRAY['transvaser','scotch','troc'], '2025-12-25 08:39:47.197137+00'),
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
