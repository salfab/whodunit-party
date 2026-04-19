import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const mysteriesDir = path.join(repoRoot, 'seed-data/mysteries');
const outputPath = path.join(repoRoot, 'seed-data/confession-rewrite-template.json');

function emptySuspectConfessions(mystery) {
  const {
    innocent_words: _innocentWords,
    guilty_words: _guiltyWords,
    ...mysteryWithoutGameplayWords
  } = mystery;

  return {
    ...mysteryWithoutGameplayWords,
    character_sheets: mystery.character_sheets.map((sheet, index) => ({
      ...sheet,
      rewrite_key: `${sheet.role}-${index}`,
      dark_secret: sheet.role === 'suspect' ? '' : sheet.dark_secret,
    })),
  };
}

const zipFiles = (await fs.readdir(mysteriesDir))
  .filter((file) => file.endsWith('.zip'))
  .sort();

const exportData = {
  format: 'whodunit-party-confession-rewrite-template',
  version: 1,
  instructions: [
    'Remplir uniquement character_sheets[].dark_secret pour les fiches dont role vaut "suspect".',
    'Ne pas modifier zip_file, mystery_index, rewrite_key, title, role, character_name, occupation, alibi, ni les autres champs de structure.',
    'Chaque dark_secret suspect doit etre un aveu narratif complet et original, coherent avec le mystere, le personnage, son alibi et le ton du pack.',
    'Le texte doit pouvoir etre lu tel quel quand ce personnage est revele coupable.',
    'Laisser les fiches investigator telles quelles.',
  ],
  mysteries: [],
};

for (const zipFile of zipFiles) {
  const zipPath = path.join(mysteriesDir, zipFile);
  const zip = await JSZip.loadAsync(await fs.readFile(zipPath));
  const mysteryFile = zip.file('mystery.json');

  if (!mysteryFile) {
    throw new Error(`${zipFile} does not contain mystery.json`);
  }

  const parsed = JSON.parse(await mysteryFile.async('string'));
  const mysteries = Array.isArray(parsed) ? parsed : [parsed];

  mysteries.forEach((mystery, mysteryIndex) => {
    exportData.mysteries.push({
      zip_file: zipFile,
      mystery_index: mysteryIndex,
      mystery: emptySuspectConfessions(mystery),
    });
  });
}

await fs.writeFile(outputPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8');

console.log(`Wrote ${exportData.mysteries.length} mysteries to ${path.relative(repoRoot, outputPath)}`);
