import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MYSTERIES_DIR = path.join(__dirname, '../seed-data/mysteries');
const TARGET_VERSION = '2.0.0';
const VALID_THEMES = new Set(['PETTY_CRIME', 'MACABRE', 'SERIOUS_MURDER', 'FUNNY_CRIME']);

function isInvestigator(sheet) {
  return sheet?.role === 'investigator';
}

function confessionPrefix(language) {
  if (language === 'en') {
    return {
      start: 'I confess everything.',
      motive: 'This secret gave me a motive, and I used the confusion to act before preparing my story to deflect suspicion.',
    };
  }

  if (language === 'es') {
    return {
      start: 'Lo confieso todo.',
      motive: 'Este secreto me dio un motivo, y aproveche la confusion para actuar antes de preparar mi historia y desviar las sospechas.',
    };
  }

  return {
    start: "J'avoue tout.",
    motive: "Ce secret m'a donne un mobile, et j'ai profite du chaos pour passer a l'acte avant de preparer mon recit pour detourner les soupcons.",
  };
}

function asConfession(secret, language) {
  const trimmed = String(secret || '').trim();
  const { start, motive } = confessionPrefix(language);

  if (
    trimmed.startsWith("J'avoue tout.") ||
    trimmed.startsWith('I confess everything.') ||
    trimmed.startsWith('Lo confieso todo.')
  ) {
    return trimmed;
  }

  return `${start}\n\nMon secret etait celui-ci : ${trimmed}\n\n${motive}`;
}

async function convertZip(zipPath) {
  const buffer = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(buffer);
  const mysteryFile = zip.file('mystery.json');

  if (!mysteryFile) {
    return { zip: path.basename(zipPath), converted: 0, skipped: true };
  }

  const parsed = JSON.parse(await mysteryFile.async('string'));
  const mysteries = Array.isArray(parsed) ? parsed : [parsed];
  let converted = 0;
  let changed = false;

  for (const mystery of mysteries) {
    const language = mystery.language || 'fr';
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

      const nextSecret = asConfession(sheet.dark_secret, language);
      const nextSheet = {
        ...sheet,
        role: 'suspect',
        dark_secret: nextSecret,
      };

      if (sheet.role !== nextSheet.role || sheet.dark_secret !== nextSecret) {
        converted += 1;
        changed = true;
      }

      return nextSheet;
    });
  }

  if (!changed) {
    return { zip: path.basename(zipPath), converted, changed, skipped: false };
  }

  const nextJson = Array.isArray(parsed) ? mysteries : mysteries[0];

  zip.file('mystery.json', JSON.stringify(nextJson, null, 2));
  const nextBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  await fs.writeFile(zipPath, nextBuffer);

  return { zip: path.basename(zipPath), converted, changed, skipped: false };
}

const zipFiles = (await fs.readdir(MYSTERIES_DIR))
  .filter((file) => file.endsWith('.zip'))
  .sort();

const results = [];
for (const zipFile of zipFiles) {
  results.push(await convertZip(path.join(MYSTERIES_DIR, zipFile)));
}

console.table(results);
