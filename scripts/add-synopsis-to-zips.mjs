#!/usr/bin/env node
/**
 * Script to add synopsis to mystery.json files inside zip archives
 * that are missing them.
 */

import { readFileSync, writeFileSync, unlinkSync, readdirSync, mkdirSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const MYSTERIES_DIR = join(import.meta.dirname, '..', 'seed-data', 'mysteries');

// Synopses generated based on descriptions (1-2 sentences, no spoilers)
const SYNOPSES = {
  'guilli-guillis-lugubres.zip': 
    "Depuis une séance de spiritisme au manoir Mornelune, quelque chose chatouille nos orteils chaque nuit — ce soir, on découvre quel esprit s'amuse à nos dépens.",
  
  'la-fausse-bombe-du-nouvel-an.zip':
    "Minuit passé, une explosion secoue la place du Nouvel An — attentat ou accident ? L'Agent Pittet démêle les témoignages contradictoires avant que la peur ne prenne le dessus.",
  
  'le_nez_hautbois_de_Pinokku.zip':
    "On a retrouvé Pinokku en larmes, son nez percé de trous comme une flûte — chaque mensonge siffle désormais. Qui a transformé la marionnette en instrument ?",
  
  'le-hollandais-violent.zip':
    "Kapitein VanHouten s'est fait voler sa jambe de bois pendant son sommeil — sans elle, il ne marche pas. Six pirates vont devoir s'expliquer, et vite.",
  
  'ma-neige-enchantee.zip':
    "Les réserves royales de poudre de Perlimpimpin sont vides — sans cette magie, les sorts du quotidien s'éteignent. Qui a siphonné les stocks avant le chaos ?",
  
  'mort-sur-la-furka.zip':
    "Nuit glaciale au col de la Furka : une voiture en morceaux et un accident qui sonne trop propre. Quelqu'un sait pourquoi ça a basculé.",
  
  'panique-noel-castors-paillettes.zip':
    "Petite-Bûche-de-Noël-Friable gît dans la neige, un tomahawk dans le dos — on parle de « suicide de nostalgie ». La tribu des Castors-à-Paillettes cache quelque chose.",
  
  'protocole-abduction.zip':
    "Arizona, 1997. Un membre de l'équipe a disparu quelques heures puis est revenu impeccable, trop impeccable. Enlèvement extraterrestre ou mise en scène terrestre ?",
  
  'qui-a-condamne-la-sortie-de-la-mine.zip':
    "L'accès de la mine a été barricadé avec soin — trop de soin — alors que trois nains étaient encore au fond. Qui a condamné la sortie ?",
  
  'qui-a-pousse-meme-dans-les-ortilles.zip':
    "Mémé Odette gît face contre terre dans les orties. On parle d'une simple chute, mais la canne cassée et les lunettes tordues racontent une autre histoire.",
  
  'rital-sous-ritaline.zip':
    "Sud de l'Italie, années 70. Gianni le rouleur de cannoli est retrouvé inerte près de boîtes d'ordonnances qui n'ont rien à faire là. Qui a laissé la dose de trop ?",
  
  'un-autel-rue-de-la-guerre.zip':
    "Au petit Beirut, quelqu'un a trafiqué le plan de table du mariage pour aligner les rancunes face à face. Les sourires grincent, les regards se plantent comme des fourchettes.",
  
  'un-vin-qui-a-du-corps.zip':
    "Stu Pedassow est mort, la tête plongée dans un tonneau de vin. Une clé a disparu, une page du registre est arrachée — quelqu'un a choisi de ne pas arrêter la catastrophe."
};

async function processZipFile(zipPath, synopsis) {
  const zipName = zipPath.split(/[/\\]/).pop();
  console.log(`Processing ${zipName}...`);
  
  // Create temp directory for extraction
  const tempDir = join(MYSTERIES_DIR, `_temp_${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  
  try {
    // Extract the zip
    execSync(`unzip -o "${zipPath}" -d "${tempDir}"`, { encoding: 'utf-8' });
    
    // Read mystery.json
    const mysteryJsonPath = join(tempDir, 'mystery.json');
    const mysteryJson = readFileSync(mysteryJsonPath, 'utf-8');
    const mystery = JSON.parse(mysteryJson);
    
    // Handle both array and single object formats
    const mysteryObj = Array.isArray(mystery) ? mystery[0] : mystery;
    
    // Check if already has synopsis
    if (mysteryObj.synopsis) {
      console.log(`  Already has synopsis, skipping.`);
      return;
    }
    
    // Add synopsis after title
    const updatedMystery = {
      title: mysteryObj.title,
      synopsis: synopsis,
      ...Object.fromEntries(
        Object.entries(mysteryObj).filter(([k]) => k !== 'title' && k !== 'synopsis')
      )
    };
    
    // Write updated JSON
    const outputJson = Array.isArray(mystery) ? [updatedMystery] : updatedMystery;
    writeFileSync(mysteryJsonPath, JSON.stringify(outputJson, null, 2));
    
    // Remove old zip and create new one
    unlinkSync(zipPath);
    execSync(`cd "${tempDir}" && zip -r "${zipPath}" .`, { encoding: 'utf-8' });
    
    console.log(`  Added synopsis: "${synopsis.substring(0, 50)}..."`);
  } finally {
    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  console.log('Adding synopses to mystery zip files...\n');
  
  for (const [zipName, synopsis] of Object.entries(SYNOPSES)) {
    const zipPath = join(MYSTERIES_DIR, zipName);
    try {
      await processZipFile(zipPath, synopsis);
    } catch (error) {
      console.error(`  Error processing ${zipName}:`, error.message);
    }
  }
  
  console.log('\nDone!');
}

main();
