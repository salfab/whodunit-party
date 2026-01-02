#!/usr/bin/env node

/**
 * Pre-test setup script
 * Ensures Supabase is running before tests start
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function ensureSupabaseRunning() {
  console.log('📦 Checking Supabase status...');
  
  try {
    const { stdout } = await execAsync('npx supabase status');
    
    if (stdout.includes('API URL')) {
      console.log('✅ Supabase is already running');
      return true;
    }
  } catch (error) {
    console.log('⏳ Starting Supabase...');
    
    try {
      await execAsync('npx supabase start');
      console.log('✅ Supabase started successfully');
      return true;
    } catch (startError) {
      console.error('❌ Failed to start Supabase');
      console.error('Please run "npx supabase start" manually');
      process.exit(1);
    }
  }
  
  return true;
}

ensureSupabaseRunning()
  .then(() => {
    console.log('✅ Pre-test setup complete\n');
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
