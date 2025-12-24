#!/usr/bin/env node

/**
 * Development setup script for whodunit-party
 * Checks for required environment variables and provides setup guidance
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Whodunit Party - Development Setup Check\n');

// Check if .env.local exists
const envPath = join(rootDir, '.env.local');
const envExists = existsSync(envPath);

if (!envExists) {
  console.log('⚠️  Missing .env.local file');
  console.log('\n📋 Setup Instructions:');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Create a Supabase project at https://supabase.com');
  console.log('3. Fill in your Supabase credentials in .env.local');
  console.log('4. Run migrations: npx supabase db push');
  console.log('5. Start the dev server: npm run dev\n');
  process.exit(0);
}

// Check environment variables
const envContent = readFileSync(envPath, 'utf-8');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

const missingVars = [];
for (const varName of requiredVars) {
  const regex = new RegExp(`^${varName}=.+`, 'm');
  if (!regex.test(envContent)) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables:');
  missingVars.forEach((v) => console.log(`   - ${v}`));
  console.log('\n📋 Please fill in the missing values in .env.local\n');
  process.exit(0);
}

console.log('✅ Environment variables configured');
console.log('✅ Ready to start development\n');
console.log('📝 Next steps:');
console.log('1. Run migrations: npx supabase db push');
console.log('2. Start dev server: npm run dev');
console.log('3. Upload mysteries at /admin/mysteries/upload');
console.log('4. Create a game at /admin/session/create\n');
