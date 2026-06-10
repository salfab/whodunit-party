// Temporary workbench for the word-pool content migration.
// - `extract`: dumps each pack's mystery.json to seed-data/_workbench/<zip-name>.json
// - `apply`:   reads seed-data/_workbench/word-pools.json (zipName -> string[15]),
//              checks every constraint, rewrites mystery.json (word_pool replaces
//              innocent_words/guilty_words, minor version bump) and re-zips in place.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MYSTERIES_DIR = path.join(__dirname, '../seed-data/mysteries');
const WORKBENCH_DIR = path.join(__dirname, '../seed-data/_workbench');

const mode = process.argv[2];

function listZips() {
  return fs.readdirSync(MYSTERIES_DIR).filter((f) => f.endsWith('.zip')).sort();
}

async function readPack(zipName) {
  const zipPath = path.join(MYSTERIES_DIR, zipName);
  const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
  const jsonFile = zip.file('mystery.json');
  if (!jsonFile) throw new Error(`${zipName}: no mystery.json at zip root`);
  const parsed = JSON.parse(await jsonFile.async('string'));
  // The schema requires an array, but tolerate legacy single-object packs.
  const mysteries = Array.isArray(parsed) ? parsed : [parsed];
  return { zipPath, zip, mysteries };
}

function bumpMinor(version) {
  const [major, minor] = (version || '1.0.0').split('.').map(Number);
  return `${major}.${(minor || 0) + 1}.0`;
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function checkPool(zipName, mystery, pool) {
  const errors = [];
  if (!Array.isArray(pool) || pool.length !== 15) {
    errors.push(`expected 15 words, got ${Array.isArray(pool) ? pool.length : typeof pool}`);
    return errors;
  }
  const trimmed = pool.map((w) => String(w).trim());
  if (trimmed.some((w) => !w)) errors.push('contains an empty word');
  if (new Set(trimmed.map(normalize)).size !== 15) errors.push('contains duplicate words');

  const forbiddenText = normalize(
    [mystery.title, mystery.synopsis || '', mystery.description].join('\n')
  );
  const characterNames = normalize(
    (mystery.character_sheets || []).map((s) => s.character_name).join('\n')
  );
  for (const word of trimmed) {
    const w = normalize(word);
    if (forbiddenText.includes(w)) {
      errors.push(`"${word}" appears in title/synopsis/description`);
    }
    if (characterNames.includes(w)) {
      errors.push(`"${word}" appears in a character name`);
    }
  }
  return errors;
}

async function extract() {
  fs.mkdirSync(WORKBENCH_DIR, { recursive: true });
  for (const zipName of listZips()) {
    const { mysteries } = await readPack(zipName);
    const outPath = path.join(WORKBENCH_DIR, zipName.replace(/\.zip$/, '.json'));
    fs.writeFileSync(outPath, JSON.stringify(mysteries, null, 2), 'utf8');
    const m = mysteries[0];
    console.log(`${zipName} | ${m.language} | v${m.version || '1.0.0'} | ${m.title}`);
  }
  console.log(`\nExtracted ${listZips().length} packs to ${WORKBENCH_DIR}`);
}

async function apply() {
  const poolsPath = path.join(WORKBENCH_DIR, 'word-pools.json');
  const pools = JSON.parse(fs.readFileSync(poolsPath, 'utf8'));
  const zips = listZips();

  const missing = zips.filter((z) => !pools[z]);
  const unknown = Object.keys(pools).filter((z) => !zips.includes(z));
  if (missing.length) console.warn(`Packs without a pool entry: ${missing.join(', ')}`);
  if (unknown.length) console.warn(`Pool entries without a pack: ${unknown.join(', ')}`);

  let failed = 0;
  for (const zipName of zips) {
    const pool = pools[zipName];
    if (!pool) continue;

    const { zipPath, zip, mysteries } = await readPack(zipName);
    const mystery = mysteries[0];

    const errors = checkPool(zipName, mystery, pool);
    if (errors.length) {
      failed += 1;
      console.error(`❌ ${zipName}:`);
      for (const e of errors) console.error(`   - ${e}`);
      continue;
    }

    const targetPool = pool.map((w) => String(w).trim());
    if (JSON.stringify(mystery.word_pool) === JSON.stringify(targetPool)) {
      console.log(`⏭️  ${zipName}: already up to date (v${mystery.version})`);
      continue;
    }

    // Bump only on the legacy->pool conversion; pool fixes reuse the bumped version.
    const previousVersion = mystery.version || '1.0.0';
    const alreadyConverted = Array.isArray(mystery.word_pool);
    delete mystery.innocent_words;
    delete mystery.guilty_words;
    mystery.word_pool = targetPool;
    mystery.version = alreadyConverted ? previousVersion : bumpMinor(previousVersion);

    zip.file('mystery.json', JSON.stringify(mysteries, null, 2));
    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
    fs.writeFileSync(zipPath, buffer);
    console.log(`✅ ${zipName}: word_pool applied, v${previousVersion} -> v${mystery.version}`);
  }

  if (failed > 0) {
    console.error(`\n${failed} pack(s) failed constraint checks.`);
    process.exit(1);
  }
}

async function validate() {
  const { default: Ajv } = await import('ajv');
  const schema = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../schemas/mystery.schema.json'), 'utf8')
  );
  const ajv = new Ajv({ allErrors: true });
  const validateList = ajv.compile(schema);

  let failed = 0;
  for (const zipName of listZips()) {
    const { mysteries } = await readPack(zipName);
    if (!validateList(mysteries)) {
      failed += 1;
      console.error(`❌ ${zipName}:`);
      for (const e of validateList.errors || []) {
        console.error(`   - ${e.instancePath || 'root'}: ${e.message}`);
      }
    }
  }
  console.log(failed === 0 ? `\nAll ${listZips().length} packs pass schema validation.` : `\n${failed} pack(s) failed.`);
  if (failed > 0) process.exit(1);
}

if (mode === 'extract') {
  await extract();
} else if (mode === 'apply') {
  await apply();
} else if (mode === 'validate') {
  await validate();
} else {
  console.error('Usage: node scripts/tmp-word-pool-workbench.mjs <extract|apply|validate>');
  process.exit(1);
}
