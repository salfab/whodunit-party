import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const mysteriesDir = path.join(repoRoot, 'seed-data/mysteries');

const inputPath = process.argv[2] ?? path.join(repoRoot, 'seed-data/confession-rewrite-template.json');

const raw = JSON.parse(await fs.readFile(inputPath, 'utf8'));

if (raw.format !== 'whodunit-party-confession-rewrite-template') {
  throw new Error(`Unexpected format: ${raw.format}`);
}

const errors = [];

// Group entries by zip_file so we open each zip once
const byZip = new Map();
for (const entry of raw.mysteries) {
  if (!byZip.has(entry.zip_file)) byZip.set(entry.zip_file, []);
  byZip.get(entry.zip_file).push(entry);
}

let updatedMysteries = 0;
let updatedSheets = 0;

for (const [zipFile, entries] of byZip) {
  const zipPath = path.join(mysteriesDir, zipFile);

  try {
    await fs.access(zipPath);
  } catch {
    errors.push(`ZIP not found: ${zipFile}`);
    continue;
  }

  const zip = await JSZip.loadAsync(await fs.readFile(zipPath));
  const mysteryFile = zip.file('mystery.json');

  if (!mysteryFile) {
    errors.push(`${zipFile}: missing mystery.json`);
    continue;
  }

  const parsed = JSON.parse(await mysteryFile.async('string'));
  const mysteries = Array.isArray(parsed) ? parsed : [parsed];

  for (const entry of entries) {
    const { zip_file, mystery_index, mystery: templateMystery } = entry;

    if (mystery_index >= mysteries.length) {
      errors.push(`${zip_file}[${mystery_index}]: mystery_index out of range (length=${mysteries.length})`);
      continue;
    }

    const target = mysteries[mystery_index];

    // Build a lookup of existing sheets by rewrite_key
    const sheetByKey = new Map();
    target.character_sheets.forEach((sheet, i) => {
      const key = `${sheet.role}-${i}`;
      sheetByKey.set(key, sheet);
    });

    for (const templateSheet of templateMystery.character_sheets) {
      // Skip investigators — their dark_secret is not reimported
      if (templateSheet.role === 'investigator') continue;

      const { rewrite_key, dark_secret, role } = templateSheet;

      if (!['investigator', 'suspect'].includes(role)) {
        errors.push(`${zip_file}[${mystery_index}] key=${rewrite_key}: unexpected role "${role}"`);
        continue;
      }

      if (!sheetByKey.has(rewrite_key)) {
        errors.push(`${zip_file}[${mystery_index}]: rewrite_key "${rewrite_key}" not found`);
        continue;
      }

      if (!dark_secret || dark_secret.trim() === '') {
        errors.push(`${zip_file}[${mystery_index}] key=${rewrite_key}: dark_secret is empty`);
        continue;
      }

      sheetByKey.get(rewrite_key).dark_secret = dark_secret;
      updatedSheets++;
    }

    updatedMysteries++;
  }

  const updatedJson = JSON.stringify(Array.isArray(parsed) ? mysteries : mysteries[0], null, 2);
  zip.file('mystery.json', updatedJson);

  const newZipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  await fs.writeFile(zipPath, newZipBuffer);
  console.log(`Updated ${zipFile} (${entries.length} mysteries)`);
}

if (errors.length > 0) {
  console.error('\nValidation errors:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`\nDone. ${updatedMysteries} mysteries updated, ${updatedSheets} suspect dark_secrets reimported.`);
