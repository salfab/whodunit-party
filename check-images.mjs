import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54421';
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log(`Connecting to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMysteryImages() {
  console.log('Checking mystery images...\n');

  // Query the mysteries
  const { data: mysteries, error } = await supabase
    .from('mysteries')
    .select('id, title, image_path')
    .or('title.ilike.%foire%,title.ilike.%Dernier Frag%');

  if (error) {
    console.error('Error fetching mysteries:', error);
    return;
  }

  console.log('Found mysteries:');
  console.log('================');
  
  for (const mystery of mysteries) {
    console.log(`\nTitle: ${mystery.title}`);
    console.log(`ID: ${mystery.id}`);
    console.log(`Image Path: ${mystery.image_path || '(NULL)'}`);
    
    if (mystery.image_path) {
      // Check if file exists in storage
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('mystery-images')
        .list('', {
          search: mystery.image_path
        });
      
      if (fileError) {
        console.log(`Storage check error: ${fileError.message}`);
      } else {
        const fileExists = fileData && fileData.length > 0;
        console.log(`File exists in storage: ${fileExists ? 'YES' : 'NO'}`);
        if (fileExists) {
          console.log(`File details:`, fileData[0]);
        }
      }
    } else {
      console.log('No image path set in database');
    }
    console.log('---');
  }

  // List all buckets
  console.log('\n\nAvailable storage buckets:');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
  } else {
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
  }
}

checkMysteryImages().catch(console.error);
