#!/usr/bin/env node

/**
 * Add short tagline synopses to mystery.json files in each zip
 * Uses jszip (already a project dependency)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import JSZip from 'jszip';

const MYSTERIES_DIR = './seed-data/mysteries';

// Short taglines for each mystery
const synopses = {
  'chou-flower-power': "Une glace sabotée transforme la gelateria en scène de crime culinaire.",
  'guilli-guillis-lugubres': "Depuis la séance de spiritisme, quelque chose chatouille les orteils chaque nuit.",
  'la-fausse-bombe-du-nouvel-an': "À minuit, tout le monde regardait le ciel — sauf quelqu'un.",
  'la-perruque-de-kojak-dans-la-soupe': "Une perruque dans la marmite : blague ou règlement de comptes ?",
  'le_conclave_au_jus_rouge': "Au conclave des vampires, l'un d'eux serait secrètement végan.",
  'le_nez_hautbois_de_Pinokku': "Quelqu'un a percé le nez de Pinokku — maintenant ses mensonges sifflent.",
  'le-hollandais-violent': "Le capitaine pirate s'est fait voler sa jambe de bois pendant son sommeil.",
  'ma-neige-enchantee': "Toute la poudre de Perlimpimpin a disparu des réserves royales.",
  'mort-sur-la-furka': "Une course nocturne au col de la Furka tourne à l'accident mortel.",
  'panique-noel-castors-paillettes': "Un tomahawk dans le dos au réveillon — ce n'est pas un suicide.",
  'protocole-abduction': "Un membre de l'équipe est revenu de son « enlèvement » trop impeccable.",
  'qui_a_laisse_la_lunette_des_toilettes_relevee': "La lunette relevée met le loto du village en ébullition.",
  'qui-a-condamne-la-sortie-de-la-mine': "Trois nains piégés au fond d'une mine barricadée avec soin.",
  'qui-a-pousse-meme-dans-les-ortilles': "Mémé Odette gît dans les orties — simple chute ou coup bas ?",
  'rital-sous-ritaline': "Le rouleur de cannoli retrouvé inerte près de boîtes suspectes.",
  'un-autel-rue-de-la-guerre': "Le plan de table a été trafiqué pour aligner les rancunes face à face.",
  'un-vin-qui-a-du-corps': "La tête dans un tonneau de vin — la fête a dérapé en une seconde.",
};

async function processZip(zipPath, baseName, synopsis) {
  // Read zip
  const zipData = readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipData);
  
  // Read mystery.json
  const mysteryFile = zip.file('mystery.json');
  if (!mysteryFile) {
    console.log(`⚠️  No mystery.json in: ${baseName}`);
    return false;
  }
  
  const content = await mysteryFile.async('string');
  let mystery = JSON.parse(content);
  
  // Handle both array and object format
  const isArray = Array.isArray(mystery);
  const mysteryObj = isArray ? mystery[0] : mystery;
  
  // Check if synopsis already exists and is the same
  if (mysteryObj.synopsis === synopsis) {
    console.log(`✓ ${baseName} (unchanged)`);
    return false;
  }
  
  if (mysteryObj.synopsis) {
    console.log(`↻ ${baseName}: "${synopsis}"`);
  } else {
    console.log(`+ ${baseName}: "${synopsis}"`);
  }
  
  mysteryObj.synopsis = synopsis;
  
  // Update mystery.json in zip
  const updatedContent = isArray ? [mysteryObj] : mysteryObj;
  zip.file('mystery.json', JSON.stringify(updatedContent, null, 2));
  
  // Write updated zip
  const newZipData = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(zipPath, newZipData);
  
  return true;
}

async function main() {
  const zipFiles = readdirSync(MYSTERIES_DIR).filter(f => f.endsWith('.zip'));
  let updated = 0;
  
  for (const zipFile of zipFiles) {
    const baseName = zipFile.replace('.zip', '');
    const synopsis = synopses[baseName];
    
    if (!synopsis) {
      console.log(`⚠️  No synopsis defined for: ${baseName}`);
      continue;
    }
    
    const zipPath = join(MYSTERIES_DIR, zipFile);
    
    try {
      if (await processZip(zipPath, baseName, synopsis)) {
        updated++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${baseName}:`, err.message);
    }
  }
  
  console.log(`\n✅ Done! Updated ${updated} mysteries.`);
}

main().catch(console.error);
