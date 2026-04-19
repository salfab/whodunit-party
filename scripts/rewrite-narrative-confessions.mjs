import fs from 'fs/promises';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MYSTERIES_DIR = path.join(__dirname, '../seed-data/mysteries');
const SOURCE_REF = '9f0e986^';

const CASE_DETAILS = new Map([
  ['Comme un poisson d’avril dans l’eau de boudin', {
    act: "j'ai remplacé Chase par ce berger allemand empaillé pour transformer le commissariat en farce morbide",
    scene: "le chenil, les badges et les couloirs trop propres du commissariat",
    pressure: "la plaisanterie devait avoir l'air d'un poisson d'avril idiot, pas d'une attaque personnelle contre Holt",
  }],
  ['À pas de loup-garou', {
    act: "j'ai provoqué la mort qui a jeté Thiercelieux dans la peur du loup-garou",
    scene: "les ruelles, les rumeurs et les volets clos du village",
    pressure: "plus tout le monde parlait de monstre, moins on regardait les mains humaines",
  }],
  ['Le Devis Disparu d’Anaconda Constructeur', {
    act: "j'ai fait disparaître le devis d'Anaconda Constructeur avant qu'il ne soit présenté",
    scene: "le Salon des Merveilles Industrielles, les stands chromés et les dossiers sous scellés",
    pressure: "le scandale devait passer pour une erreur de salon, pas pour un sabotage calculé",
  }],
  ["L'attaque des tiquants", {
    act: "j'ai fait taire celui qui utilisait nos tics comme une arme contre nous",
    scene: "la salle de réunion, les chaises en cercle et les regards qui se baissent",
    pressure: "je comptais sur la honte de chacun pour couvrir la mienne",
  }],
  ["Audit interne d'un REPAS DISPARU", {
    act: "j'ai volé les vermicelles aux marrons du CEO et déclenché ce ridicule audit interne",
    scene: "la salle de pause, le frigo commun et les post-it passifs-agressifs",
    pressure: "personne ne devait croire qu'un repas pouvait cacher une vraie rancœur",
  }],
  ['Chou-Flower Power', {
    act: "j'ai saboté la glace de la gelateria et remplacé l'innocente vanille par l'horreur servie aux clients",
    scene: "le comptoir glacé, les cuillères levées et l'odeur sucrée devenue suspecte",
    pressure: "la panique sanitaire devait masquer un geste très personnel",
  }],
  ['L’Affaire du Concombre Sacré', {
    act: "j'ai laissé fuiter le secret du Concombre Sacré jusque chez les mortels",
    scene: "le Conseil olympien, les plats intouchables et les dieux vexés",
    pressure: "une recette semblait trop absurde pour révéler une trahison divine",
  }],
  ['Dernier Strike pour Billy Callaghan', {
    act: "j'ai coincé Billy Callaghan dans la mécanique du bowling et maquillé la piste en accident de néons",
    scene: "l'arrière-salle, les retours de boules et le grondement des machines",
    pressure: "le vacarme des pistes devait avaler le moment où tout a basculé",
  }],
  ['Guilli-Guillis Lugubres', {
    act: "j'ai orchestré les chatouilles nocturnes qui ont changé la séance de spiritisme en cauchemar",
    scene: "le caveau Mornelune, les bougies et les vieilles pierres qui rendent tout crédible",
    pressure: "si tout le monde parlait de fantôme, personne ne chercherait le vivant derrière la farce",
  }],
  ['La fausse bombe du Nouvel An', {
    act: "j'ai monté la fausse alerte à la bombe pendant que minuit noyait tout sous la fumée et les cris",
    scene: "la place trempée, les feux du Nouvel An et les témoins occupés à regarder le ciel",
    pressure: "le bruit devait couvrir mon mobile autant que mes gestes",
  }],
  ['La perruque de Kojak dans la soupe', {
    act: "j'ai plongé la perruque de Kojak dans la soupe de l'amicale",
    scene: "la marmite, les bols fumants et les sourires qui se crispent",
    pressure: "la blague capillaire devait cacher un règlement de comptes bien plus laid",
  }],
  ['Le Hollandais Violent', {
    act: "j'ai volé la jambe de bois du capitaine VanHouten pendant son sommeil",
    scene: "le pont grinçant, les hamacs et la mer qui secoue les mensonges",
    pressure: "un équipage humilié accuse vite au hasard, et c'est exactement ce que je voulais",
  }],
  ['Le conclave au jus rouge', {
    act: "j'ai trahi le conclave en laissant circuler la vérité végétale que tout vampire voulait enterrer",
    scene: "le velours, les chandelles et les coupes trop rouges pour être honnêtes",
    pressure: "la honte du véganisme devait mordre plus fort que les preuves",
  }],
  ['Le Fantôme du Grand Huit', {
    act: "j'ai fabriqué l'apparition du Grand Huit pour arrêter Noctiland dans un cri",
    scene: "les rails figés, la brume et les décors qui avalent les silhouettes",
    pressure: "un fantôme attire les lampes torches; moi, j'avais besoin d'ombre",
  }],
  ['Le "nez" hautbois de Pinokku', {
    act: "j'ai percé le nez de Pinokku jusqu'à faire siffler ses mensonges",
    scene: "le clocher, les copeaux de bois et cette musique ridicule qui trahit chaque phrase",
    pressure: "tout le monde devait rire du sort de Pinokku avant de penser au coupable",
  }],
  ['Ma Neige Enchantée', {
    act: "j'ai vidé les réserves royales de poudre de Perlimpimpin",
    scene: "les fioles vides, les étagères glacées et le royaume qui perd son éclat",
    pressure: "sans magie, chacun panique; dans la panique, mon mobile devenait invisible",
  }],
  ["Meurtre à l'opéra", {
    act: "j'ai transformé la première de l'Opéra Verlaine en tragédie réelle",
    scene: "les coulisses, la machinerie, la poudre et le velours rouge",
    pressure: "sur scène, tout le monde ment déjà; il suffisait d'ajouter mon crime au décor",
  }],
  ['Mort sur la Furka', {
    act: "j'ai provoqué l'accident mortel sur la route glacée de la Furka",
    scene: "les virages, la fumée de pneus et les phares qui découpent la nuit",
    pressure: "la montagne donne toujours une excuse aux imprudents, et je m'en suis servi",
  }],
  ['Panique à Noël chez la tribu des Castors-à-Paillettes', {
    act: "j'ai planté le tomahawk dans le dos de Petiteb-Bûche-de-Noël-Friable",
    scene: "la neige du réveillon, les braises basses et les paillettes collées aux manteaux",
    pressure: "la fête devait fournir assez de nostalgie pour maquiller ma violence",
  }],
  ['Panique au Salon des Mochis', {
    act: "j'ai fait disparaître le Mochi d'Or et laissé la mascotte s'effondrer au milieu des confettis",
    scene: "les stands pastel, les sacs trop lourds et les sourires collants",
    pressure: "dans le sucre et la foule, un geste précis passe pour un accident mou",
  }],
  ['Pitch Empoisonné', {
    act: "j'ai empoisonné le toast du CEO au moment où tout le monde regardait l'avenir de la boîte",
    scene: "l'étage verrouillé, les coupes levées et les investisseurs qui retiennent leur souffle",
    pressure: "un pitch est déjà une mise en scène; j'ai seulement choisi la dernière réplique",
  }],
  ['Protocole Abduction', {
    act: "j'ai organisé l'abduction et le remplacement qui hantent maintenant la base",
    scene: "les néons de l'Arizona, les radios qui grésillent et les couloirs sous protocole",
    pressure: "plus l'explication semblait extraterrestre, moins on croyait à une décision humaine",
  }],
  ['Qui a condamné la sortie de la mine alors qu’il y avait trois nains dedans ?', {
    act: "j'ai condamné la sortie secondaire de la mine alors que trois nains étaient encore au fond",
    scene: "les pierres neuves, les torches et l'air lourd de la galerie",
    pressure: "une barricade ressemble à de la panique tant qu'on ne voit pas le soin qu'on y a mis",
  }],
  ['Qui a poussé Mémé dans les ortilles ?', {
    act: "j'ai poussé Mémé Odette dans les orties et abandonné sa canne brisée près du seuil",
    scene: "le jardin, les lunettes tordues et le silence trop propre du hameau",
    pressure: "une vieille dame qui tombe, ça arrange tout le monde quand personne ne veut regarder",
  }],
  ['Qui a laissé la lunette des toilettes relevée ?', {
    act: "j'ai laissé la lunette relevée pour transformer le loto en tribunal de village",
    scene: "les toilettes mixtes, les cartons de bingo et la salle des fêtes prête à exploser",
    pressure: "un petit affront suffit quand chacun arrive avec ses rancunes sous le bras",
  }],
  ['Rital sous Ritaline', {
    act: "j'ai provoqué la chute de Gianni au milieu des ordonnances et de la farine",
    scene: "la cuisine trop chaude, les cannoli inachevés et les boîtes suspectes près du café froid",
    pressure: "tout le village voulait croire à l'épuisement; moi, j'avais besoin qu'on y croie",
  }],
  ['Rouge interdit', {
    act: "j'ai fait arriver ce magnum de rouge jusqu'à Lolo, douze ans, en pleine nuit chaux-de-fonnière",
    scene: "la neige, les routes de montagne et le cadeau absurde posé comme une provocation",
    pressure: "un village solidaire sait aussi se taire ensemble, et je comptais là-dessus",
  }],
  ['Un autel rue de la guerre : resto-rancœur', {
    act: "j'ai trafiqué le plan de table pour aligner les rancunes comme des cierges devant l'autel",
    scene: "le restaurant, les verres qui trinquent et les familles placées face à leurs vieilles blessures",
    pressure: "un mariage pardonne beaucoup de malaises; j'ai misé sur ce réflexe",
  }],
  ['Un Casino en campagne : c’est Trélex', {
    act: "j'ai court-circuité l'enquête publique pour faire surgir le casino et sa tour au milieu de Trélex",
    scene: "les champs, les néons rose-turquoise et les dossiers administratifs introuvables",
    pressure: "un chantier pareil paraît trop gros pour être l'œuvre d'une seule main",
  }],
  ['Un vin qui a du corps', {
    act: "j'ai envoyé Stu Pedassow vers ce tonneau de vin dont il n'est jamais ressorti",
    scene: "le chai humide, la clé manquante et la page arrachée du registre",
    pressure: "le vin garde les odeurs, mais il noie bien les secondes où l'on choisit de ne pas sauver quelqu'un",
  }],
  ['Un tueur parmi les éducateurs', {
    act: "j'ai tué l'éducateur pendant la veillée au bord du lac",
    scene: "les braises, les lampes frontales et l'eau noire qui avale les sons",
    pressure: "un camp doit rassurer les enfants; ce devoir de calme m'a offert ma couverture",
  }],
]);

function cleanText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sentence(value) {
  const trimmed = cleanText(value);
  if (!trimmed) return '';
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function hashIndex(seed, size) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % size;
}

function variant(seed, options) {
  return options[hashIndex(seed, options.length)];
}

function compactSourceSecret(secret) {
  const text = cleanText(secret)
    .replace(/^J'avoue tout\.\s*/i, '')
    .replace(/Mon secret etait celui-ci\s*:\s*/i, '')
    .replace(/Ce secret m'a donne un mobile[\s\S]*$/i, '')
    .trim();

  if (text.length <= 1100) {
    return text;
  }

  const sentences = text
    .split(/(?<=[.!?…])\s+/)
    .filter(Boolean);
  let result = '';
  for (const part of sentences) {
    if ((result + ' ' + part).trim().length > 1000) break;
    result = `${result} ${part}`.trim();
  }
  return result || text.slice(0, 1000).replace(/\s+\S*$/, '');
}

function findSourceSheet(sourceMystery, currentSheet, suspectIndex) {
  const sourceSheets = sourceMystery.character_sheets || [];
  const byName = sourceSheets.find((sheet) => sheet.character_name === currentSheet.character_name);
  if (byName) return byName;

  const sourceSuspects = sourceSheets.filter((sheet) => sheet.role !== 'investigator');
  return sourceSuspects[suspectIndex] || currentSheet;
}

function buildConfession({ mystery, sheet, sourceSheet, suspectIndex }) {
  const details = CASE_DETAILS.get(mystery.title) || {
    act: "j'ai commis le geste qui a lancé toute cette enquête",
    scene: `l'affaire ${mystery.title}`,
    pressure: "je comptais sur les contradictions des autres pour disparaître dans le bruit",
  };
  const name = sheet.character_name || `suspect ${suspectIndex + 1}`;
  const occupation = sheet.occupation ? `, ${sheet.occupation},` : '';
  const motive = sentence(compactSourceSecret(sourceSheet.dark_secret || sheet.dark_secret));
  const alibi = sentence(sourceSheet.alibi || sheet.alibi);
  const seed = `${mystery.title}:${name}:${motive}`;

  const openers = [
    `Je vais arrêter de jouer mon rôle : moi, ${name}${occupation} ${details.act}.`,
    `Voici la vérité, sans décor et sans échappatoire : ${name}${occupation} c'était moi, et ${details.act}.`,
    `On a cherché un monstre, un hasard ou une erreur; il fallait simplement me regarder. ${name}${occupation} ${details.act}.`,
    `Je connais le moment exact où j'aurais pu reculer. Je ne l'ai pas fait. ${name}${occupation} ${details.act}.`,
  ];
  const motiveLines = [
    `Ce n'est pas venu de nulle part. ${motive} Ce secret me suivait jusque dans ${details.scene}, et chaque question risquait de l'ouvrir devant tout le monde.`,
    `Mon mobile tenait dans ce que je cachais le mieux. ${motive} À force de le protéger, j'ai fini par trouver normal de sacrifier quelqu'un ou quelque chose à sa place.`,
    `Je voulais que cette histoire reste enfouie : ${motive} Quand l'affaire a commencé à tourner autour de moi, j'ai préféré salir la scène plutôt que laisser mon nom remonter.`,
    `Tout part de là : ${motive} Ce n'était plus seulement une honte privée; c'était une corde autour de ma gorge, et je l'ai tirée sur quelqu'un d'autre.`,
  ];
  const actionLines = [
    `J'ai choisi mon moment parce que ${details.pressure}. Je savais où les regards iraient, quelles versions paraîtraient plausibles, et quelles petites lâchetés chacun voudrait garder pour soi.`,
    `Le geste a été plus calme que ce que les autres imaginent. Dans ${details.scene}, j'ai avancé avec assez de peur pour trembler, mais assez de lucidité pour effacer ce qui devait l'être.`,
    `Je n'ai pas improvisé autant que je le prétends. J'ai laissé l'affaire prendre la forme qui m'arrangeait, parce que ${details.pressure}.`,
    `Une fois lancé, je n'ai plus pensé à réparer. J'ai pensé à survivre, à orienter les soupçons, à transformer ${details.scene} en labyrinthe.`,
  ];
  const alibiLines = [
    `Mon alibi n'était pas seulement un souvenir, c'était une barrière : ${alibi} Je l'ai poli assez pour qu'il sonne humain, pas assez pour qu'on entende le mensonge dessous.`,
    `Puis j'ai raconté ce qui devait me sauver : ${alibi} Chaque détail était choisi pour paraître banal, parce que le banal fatigue les enquêteurs.`,
    `J'ai donné mon alibi comme on tend une couverture à quelqu'un qui grelotte : ${alibi} Il avait l'air utile; il était surtout fait pour cacher mes mains.`,
    `Quand on m'a interrogé, je me suis accroché à cette version : ${alibi} Je savais qu'une histoire simple vaut parfois mieux qu'une preuve compliquée.`,
  ];
  const endings = [
    `Voilà pourquoi je n'avais pas seulement peur d'être accusé. J'avais peur que quelqu'un comprenne que, pendant toute l'enquête, je rejouais déjà ma confession en silence.`,
    `Je peux encore donner des détails, corriger des horaires, nommer les objets déplacés. Mais l'essentiel tient en une phrase : j'ai choisi mon secret plutôt que la vérité.`,
    `Les autres ont menti pour se protéger. Moi, j'ai menti parce que sans ce mensonge il ne restait plus rien entre mon geste et moi.`,
    `Je laisse tomber le masque maintenant, parce que la partie est finie et que mon alibi ne mérite plus qu'on le porte à ma place.`,
  ];

  return [
    variant(`${seed}:open`, openers),
    variant(`${seed}:motive`, motiveLines),
    variant(`${seed}:action`, actionLines),
    variant(`${seed}:alibi`, alibiLines),
    variant(`${seed}:end`, endings),
  ].join('\n\n');
}

async function loadZipFromGit(ref, zipName) {
  const buffer = execFileSync('git', ['show', `${ref}:seed-data/mysteries/${zipName}`], {
    encoding: null,
    maxBuffer: 50_000_000,
  });
  return JSZip.loadAsync(buffer);
}

async function rewriteZip(zipName) {
  const zipPath = path.join(MYSTERIES_DIR, zipName);
  const currentZip = await JSZip.loadAsync(await fs.readFile(zipPath));
  const sourceZip = await loadZipFromGit(SOURCE_REF, zipName);
  const currentParsed = JSON.parse(await currentZip.file('mystery.json').async('string'));
  const sourceParsed = JSON.parse(await sourceZip.file('mystery.json').async('string'));
  const currentMysteries = Array.isArray(currentParsed) ? currentParsed : [currentParsed];
  const sourceMysteries = Array.isArray(sourceParsed) ? sourceParsed : [sourceParsed];
  let rewritten = 0;

  for (let mysteryIndex = 0; mysteryIndex < currentMysteries.length; mysteryIndex += 1) {
    const mystery = currentMysteries[mysteryIndex];
    const sourceMystery = sourceMysteries[mysteryIndex] || sourceMysteries.find((source) => source.title === mystery.title) || mystery;
    let suspectIndex = 0;

    mystery.character_sheets = mystery.character_sheets.map((sheet) => {
      if (sheet.role === 'investigator') {
        return sheet;
      }

      const sourceSheet = findSourceSheet(sourceMystery, sheet, suspectIndex);
      const nextSheet = {
        ...sheet,
        role: 'suspect',
        dark_secret: buildConfession({ mystery, sheet, sourceSheet, suspectIndex }),
      };
      suspectIndex += 1;
      rewritten += 1;
      return nextSheet;
    });
  }

  currentZip.file('mystery.json', JSON.stringify(Array.isArray(currentParsed) ? currentMysteries : currentMysteries[0], null, 2));
  await fs.writeFile(zipPath, await currentZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  }));

  return { zip: zipName, rewritten };
}

const zipFiles = (await fs.readdir(MYSTERIES_DIR))
  .filter((file) => file.endsWith('.zip'))
  .sort();

const results = [];
for (const zipFile of zipFiles) {
  results.push(await rewriteZip(zipFile));
}

console.table(results);
