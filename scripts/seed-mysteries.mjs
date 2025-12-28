import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MYSTERIES_DIR = path.join(__dirname, '../seed-data/mysteries');
const API_URL = process.env.API_URL || 'http://127.0.0.1:3000';

async function seedMysteries() {
  try {
    // Check if mysteries directory exists
    if (!fs.existsSync(MYSTERIES_DIR)) {
      console.log('⚠️  No seed-data/mysteries directory found. Skipping mystery seeding.');
      return;
    }

    const zipFiles = fs.readdirSync(MYSTERIES_DIR)
      .filter(f => f.endsWith('.zip'))
      .sort();

    if (zipFiles.length === 0) {
      console.log('⚠️  No mystery pack files found in seed-data/mysteries/. Skipping.');
      return;
    }

    console.log(`🎭 Found ${zipFiles.length} mystery packs to seed\n`);
    console.log(`📡 API URL: ${API_URL}\n`);

    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const zipFile of zipFiles) {
      const filePath = path.join(MYSTERIES_DIR, zipFile);
      
      // Create FormData using native fetch API
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);
      const formData = new FormData();
      formData.append('file', blob, zipFile);

      console.log(`📦 Uploading ${zipFile}...`);

      try {
        const response = await fetch(`${API_URL}/api/mysteries/upload-pack`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          console.log(`✅ ${zipFile} processed successfully`);
          
          if (result.uploaded?.length > 0) {
            result.uploaded.forEach(m => {
              console.log(`   ✨ Uploaded: ${m.title} v${m.version}`);
              totalUploaded++;
            });
          }
          
          if (result.skipped?.length > 0) {
            result.skipped.forEach(m => {
              console.log(`   ⏭️  Skipped: ${m.title} - ${m.reason}`);
              totalSkipped++;
            });
          }
        } else {
          console.error(`❌ ${zipFile} failed: ${result.error}`);
          if (result.details) {
            console.error(`   Details: ${result.details}`);
          }
          totalFailed++;
        }
      } catch (error) {
        console.error(`❌ ${zipFile} error: ${error.message}`);
        totalFailed++;
      }
      
      console.log('');
    }

    console.log('━'.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✨ Uploaded: ${totalUploaded} mysteries`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} mysteries`);
    console.log(`   ❌ Failed: ${totalFailed} packs`);
    console.log('━'.repeat(60));

    if (totalFailed > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Fatal error during mystery seeding:', error);
    process.exit(1);
  }
}

seedMysteries();
