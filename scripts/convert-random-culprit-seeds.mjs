import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MYSTERIES_DIR = path.join(__dirname, '../seed-data/mysteries');
const TARGET_VERSION = '2.0.0';
const VALID_THEMES = new Set(['PETTY_CRIME', 'MACABRE', 'SERIOUS_MURDER', 'FUNNY_CRIME']);

const GENERIC_SECRET_MARKERS = [
  'Mon secret etait celui-ci :',
  'My secret was this:',
  'Mi secreto era este:',
];

function isInvestigator(sheet) {
  return sheet?.role === 'investigator';
}

function normalizeForMatch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['’]/g, ' ')
    .toLowerCase();
}

function stripGenericConfession(secret) {
  const trimmed = String(secret || '').trim();
  const marker = GENERIC_SECRET_MARKERS.find((candidate) => trimmed.includes(candidate));

  if (!marker) {
    return trimmed;
  }

  const afterMarker = trimmed.slice(trimmed.indexOf(marker) + marker.length).trim();
  const motiveBreaks = [
    "\n\nCe secret m'a donne",
    '\n\nThis secret gave me',
    '\n\nEste secreto me dio',
  ];
  const motiveIndex = motiveBreaks
    .map((candidate) => afterMarker.indexOf(candidate))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  return (motiveIndex === undefined ? afterMarker : afterMarker.slice(0, motiveIndex)).trim();
}

function looksLikeConfession(secret) {
  const normalized = normalizeForMatch(secret);

  if (
    normalized.includes('mon secret etait celui-ci') ||
    normalized.includes('my secret was this') ||
    normalized.includes('mi secreto era este')
  ) {
    return false;
  }

  const confessionMarkers = [
    "j'avoue",
    "j ai avoue",
    'je confesse',
    'oui, c est moi',
    'd accord',
    'je vais te le dire',
    'je vais enfin dire',
    'je vais vous le dire',
    'je ne peux plus maintenir mon histoire',
    'il faut que la verite sorte',
    'j ai laisse les autres chercher ailleurs',
    'mon secret n etait pas un detail',
    'tout est parti de ce que je cachais',
    'ce que je refusais d avouer',
    'je pensais pouvoir enterrer cette verite',
    'i confess',
    'i cannot keep the story',
    'the truth is this',
    'i let the others chase shadows',
    'my secret was not a harmless embarrassment',
    'everything began with what i was hiding',
    'what i refused to admit',
    'i thought i could bury this truth',
    'lo confieso',
    'ya no puedo sostener mi historia',
    'la verdad es esta',
    'deje que los demas miraran',
    'mi secreto no era una simple verguenza',
    'todo empezo con lo que ocultaba',
    'lo que no queria admitir',
    'crei que podia enterrar esta verdad',
  ];
  return confessionMarkers.some((marker) => normalized.includes(marker));
}

function variantIndex(seed, size) {
  const normalized = normalizeForMatch(seed);
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return hash % size;
}

function sentence(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  return /[.!?)]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function suspectLabel(sheet) {
  return sheet.character_name || sheet.occupation || 'ce personnage';
}

function frenchConfession(sheet, mystery) {
  const name = suspectLabel(sheet);
  const originalSecret = sentence(stripGenericConfession(sheet.dark_secret));
  const alibi = sentence(sheet.alibi);
  const seed = `${mystery.title}:${name}:${originalSecret}`;
  const opener = [
    `J'avoue tout : ${name} n'etait pas seulement pris dans cette affaire, j'en etais la cause.`,
    `Je ne peux plus maintenir mon histoire : ${name}, c'etait moi.`,
    `Il faut que la verite sorte : sous le nom de ${name}, j'ai choisi de passer a l'acte.`,
    `J'ai laisse les autres chercher ailleurs, mais ${name} portait le vrai mobile.`,
  ][variantIndex(`${seed}:opener`, 4)];
  const secretBridge = [
    `Mon secret n'etait pas un detail honteux : ${originalSecret}`,
    `Tout est parti de ce que je cachais : ${originalSecret}`,
    `Ce que je refusais d'avouer m'a donne le mobile : ${originalSecret}`,
    `Je pensais pouvoir enterrer cette verite, mais elle explique mon geste : ${originalSecret}`,
  ][variantIndex(`${seed}:secret`, 4)];
  const action = [
    `Quand j'ai compris que ce secret pouvait etre expose, j'ai agi pour reprendre le controle.`,
    `J'ai transforme cette peur en decision, puis j'ai profite de la confusion du mystere.`,
    `J'ai attendu le moment ou chacun regardait ailleurs, puis j'ai fait ce qu'il fallait pour proteger ma version des faits.`,
    `La panique m'a servi de mobile autant que de couverture : j'ai frappe avant d'etre demasque.`,
  ][variantIndex(`${seed}:action`, 4)];
  const alibiLine = alibi
    ? [
      `Mon alibi etait prepare pour tenir l'enqueteur a distance : ${alibi}`,
      `Ce que je presentais comme une aide etait surtout un ecran de fumee : ${alibi}`,
      `J'ai raconte cette version pour orienter les soupcons ailleurs : ${alibi}`,
      `Mon histoire devait paraitre utile, alors qu'elle couvrait mon geste : ${alibi}`,
    ][variantIndex(`${seed}:alibi`, 4)]
    : `Je n'avais pas besoin d'un alibi parfait, seulement d'un doute suffisant.`;
  const ending = [
    `Si j'ai menti, c'etait pour gagner quelques minutes de plus avant que tout s'effondre.`,
    `Je voulais que l'enquete se perde dans les details pendant que ma responsabilite restait invisible.`,
    `Je savais que chacun avait quelque chose a cacher, et j'ai compte la-dessus pour survivre a la partie.`,
    `Voila pourquoi mes reponses sonnaient juste assez vraies pour etre dangereuses.`,
  ][variantIndex(`${seed}:ending`, 4)];

  return `${opener}\n\n${secretBridge}\n\n${action}\n\n${alibiLine}\n\n${ending}`;
}

function englishConfession(sheet, mystery) {
  const name = suspectLabel(sheet);
  const originalSecret = sentence(stripGenericConfession(sheet.dark_secret));
  const alibi = sentence(sheet.alibi);
  const seed = `${mystery.title}:${name}:${originalSecret}`;
  const opener = [
    `I confess: ${name} was not just caught in this case, I was the reason it happened.`,
    `I cannot keep the story straight any longer: as ${name}, I was the one who acted.`,
    `The truth is this: behind ${name}, I had the motive everyone missed.`,
    `I let the others chase shadows, but ${name} carried the real reason to strike.`,
  ][variantIndex(`${seed}:opener`, 4)];
  const secretBridge = [
    `My secret was not a harmless embarrassment: ${originalSecret}`,
    `Everything began with what I was hiding: ${originalSecret}`,
    `What I refused to admit gave me a motive: ${originalSecret}`,
    `I thought I could bury this truth, but it explains what I did: ${originalSecret}`,
  ][variantIndex(`${seed}:secret`, 4)];
  const action = [
    `When I realized it could come out, I acted before anyone could put the pieces together.`,
    `I turned that fear into a decision, then used the confusion to cover my tracks.`,
    `I waited until everyone looked elsewhere, then protected my version of events the only way I saw left.`,
    `Panic gave me both motive and cover: I struck before I could be exposed.`,
  ][variantIndex(`${seed}:action`, 4)];
  const alibiLine = alibi
    ? [
      `My alibi was built to keep the investigator away from the truth: ${alibi}`,
      `What sounded helpful was really a screen: ${alibi}`,
      `I told that version so suspicion would drift elsewhere: ${alibi}`,
      `My story had to sound useful while it hid what I had done: ${alibi}`,
    ][variantIndex(`${seed}:alibi`, 4)]
    : `I did not need a perfect alibi, only enough doubt to survive.`;
  const ending = [
    `I lied because a few more minutes were all I needed.`,
    `I wanted the investigation lost in details while my responsibility stayed invisible.`,
    `Everyone had something to hide, and I counted on that to survive the game.`,
    `That is why my answers sounded just true enough to be dangerous.`,
  ][variantIndex(`${seed}:ending`, 4)];

  return `${opener}\n\n${secretBridge}\n\n${action}\n\n${alibiLine}\n\n${ending}`;
}

function spanishConfession(sheet, mystery) {
  const name = suspectLabel(sheet);
  const originalSecret = sentence(stripGenericConfession(sheet.dark_secret));
  const alibi = sentence(sheet.alibi);
  const seed = `${mystery.title}:${name}:${originalSecret}`;
  const opener = [
    `Lo confieso todo: ${name} no solo estaba dentro del caso, era la causa.`,
    `Ya no puedo sostener mi historia: como ${name}, fui yo.`,
    `La verdad es esta: detras de ${name} estaba el verdadero motivo.`,
    `Deje que los demas miraran a otro lado, pero ${name} tenia la razon para actuar.`,
  ][variantIndex(`${seed}:opener`, 4)];
  const secretBridge = [
    `Mi secreto no era una simple verguenza: ${originalSecret}`,
    `Todo empezo con lo que ocultaba: ${originalSecret}`,
    `Lo que no queria admitir me dio el motivo: ${originalSecret}`,
    `Crei que podia enterrar esta verdad, pero explica lo que hice: ${originalSecret}`,
  ][variantIndex(`${seed}:secret`, 4)];
  const action = [
    `Cuando entendi que podia salir a la luz, actue antes de que alguien uniera las pistas.`,
    `Converti ese miedo en una decision y use la confusion para cubrir mis pasos.`,
    `Espere el momento en que todos miraban hacia otra parte y protegi mi version de los hechos.`,
    `El panico me dio motivo y cobertura: actue antes de quedar expuesto.`,
  ][variantIndex(`${seed}:action`, 4)];
  const alibiLine = alibi
    ? [
      `Mi coartada estaba hecha para alejar al investigador de la verdad: ${alibi}`,
      `Lo que parecia ayuda era en realidad una cortina de humo: ${alibi}`,
      `Conte esa version para que las sospechas fueran a otro lugar: ${alibi}`,
      `Mi historia tenia que sonar util mientras ocultaba lo que hice: ${alibi}`,
    ][variantIndex(`${seed}:alibi`, 4)]
    : `No necesitaba una coartada perfecta, solo una duda suficiente.`;
  const ending = [
    `Menti porque necesitaba unos minutos mas.`,
    `Queria que la investigacion se perdiera en detalles mientras mi culpa seguia invisible.`,
    `Todos tenian algo que ocultar, y conte con eso para sobrevivir a la partida.`,
    `Por eso mis respuestas sonaban lo bastante ciertas como para ser peligrosas.`,
  ][variantIndex(`${seed}:ending`, 4)];

  return `${opener}\n\n${secretBridge}\n\n${action}\n\n${alibiLine}\n\n${ending}`;
}

function asConfession(sheet, mystery) {
  const originalSecret = stripGenericConfession(sheet.dark_secret);

  if (looksLikeConfession(originalSecret)) {
    return originalSecret;
  }

  if (mystery.language === 'en') {
    return englishConfession({ ...sheet, dark_secret: originalSecret }, mystery);
  }

  if (mystery.language === 'es') {
    return spanishConfession({ ...sheet, dark_secret: originalSecret }, mystery);
  }

  return frenchConfession({ ...sheet, dark_secret: originalSecret }, mystery);
}

async function convertZip(zipPath) {
  const buffer = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(buffer);
  const mysteryFile = zip.file('mystery.json');

  if (!mysteryFile) {
    return { zip: path.basename(zipPath), converted: 0, preserved: 0, changed: false, skipped: true };
  }

  const parsed = JSON.parse(await mysteryFile.async('string'));
  const mysteries = Array.isArray(parsed) ? parsed : [parsed];
  let converted = 0;
  let preserved = 0;
  let changed = false;

  for (const mystery of mysteries) {
    if (mystery.version !== TARGET_VERSION) {
      mystery.version = TARGET_VERSION;
      changed = true;
    }
    if (!VALID_THEMES.has(mystery.theme)) {
      mystery.theme = 'FUNNY_CRIME';
      changed = true;
    }
    mystery.character_sheets = mystery.character_sheets.map((sheet) => {
      if (isInvestigator(sheet)) {
        return sheet;
      }

      const originalSecret = stripGenericConfession(sheet.dark_secret);
      const nextSecret = asConfession(sheet, mystery);
      const nextSheet = {
        ...sheet,
        role: 'suspect',
        dark_secret: nextSecret,
      };

      if (looksLikeConfession(originalSecret) && originalSecret === nextSecret) {
        preserved += 1;
      }
      if (sheet.role !== nextSheet.role || sheet.dark_secret !== nextSecret) {
        converted += 1;
        changed = true;
      }

      return nextSheet;
    });
  }

  if (!changed) {
    return { zip: path.basename(zipPath), converted, preserved, changed, skipped: false };
  }

  const nextJson = Array.isArray(parsed) ? mysteries : mysteries[0];

  zip.file('mystery.json', JSON.stringify(nextJson, null, 2));
  const nextBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  await fs.writeFile(zipPath, nextBuffer);

  return { zip: path.basename(zipPath), converted, preserved, changed, skipped: false };
}

const zipFiles = (await fs.readdir(MYSTERIES_DIR))
  .filter((file) => file.endsWith('.zip'))
  .sort();

const results = [];
for (const zipFile of zipFiles) {
  results.push(await convertZip(path.join(MYSTERIES_DIR, zipFile)));
}

console.table(results);
