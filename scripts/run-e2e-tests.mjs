#!/usr/bin/env node

/**
 * Cypress E2E Test Runner
 * 
 * This script:
 * 1. Ensures Supabase is running (starts it if needed)
 * 2. Starts the Next.js dev server
 * 3. Detects the port the server is running on
 * 4. Updates Cypress config with the detected URL
 * 5. Runs Cypress tests
 * 6. Cleans up after tests
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const isOpenMode = args.includes('--open') || args.includes('-o');
const cypressArgs = args.filter(arg => !['--open', '-o'].includes(arg));

console.log('🚀 Starting E2E test environment...\n');

// Step 1: Check/Start Supabase
async function ensureSupabaseRunning() {
  console.log('📦 Checking Supabase status...');
  
  try {
    const { stdout } = await execAsync('npx supabase status', { cwd: projectRoot });
    
    if (stdout.includes('API URL')) {
      console.log('✅ Supabase is already running\n');
      return true;
    }
  } catch (error) {
    // Supabase not running, try to start it
    console.log('⏳ Supabase not running, starting...');
    
    try {
      await execAsync('npx supabase start', { cwd: projectRoot });
      console.log('✅ Supabase started successfully\n');
      return true;
    } catch (startError) {
      console.error('❌ Failed to start Supabase:', startError.message);
      console.error('Please run "npx supabase start" manually\n');
      return false;
    }
  }
  
  return true;
}

// Step 2: Start Next.js dev server and detect port
async function startDevServer() {
  console.log('🔧 Starting Next.js dev server...');
  
  // First check if a server is already running on common ports
  const commonPorts = [3000, 3001, 3002, 3003];
  
  for (const port of commonPorts) {
    try {
      const response = await fetch(`http://localhost:${port}`, { method: 'HEAD' });
      if (response.ok || response.status === 404) {
        console.log(`✅ Dev server already running on port ${port}\n`);
        return { devProcess: null, port };
      }
    } catch (error) {
      // Port not responding, continue checking
    }
  }
  
  return new Promise((resolve, reject) => {
    const devProcess = spawn('pnpm', ['dev'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
    });
    
    let port = null;
    let resolveTimeout = setTimeout(() => {
      reject(new Error('Timeout waiting for dev server to start'));
    }, 60000); // 60 second timeout
    
    devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      // Detect port from Next.js output
      // Matches: "Local:        http://localhost:3002" or "- Local:        http://localhost:3002"
      const portMatch = output.match(/(?:Local|http):?\s+https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/);
      if (portMatch && !port) {
        port = parseInt(portMatch[1], 10);
        console.log(`\n✅ Dev server detected on port ${port}\n`);
        clearTimeout(resolveTimeout);
        resolve({ devProcess, port });
      }
    });
    
    devProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    devProcess.on('error', (error) => {
      clearTimeout(resolveTimeout);
      reject(error);
    });
  });
}

// Step 3: Update Cypress config with detected port
async function setCypressBaseUrl(port) {
  console.log(`📝 Setting Cypress baseUrl to http://localhost:${port}...\n`);
  
  // Set environment variable for Cypress
  process.env.CYPRESS_BASE_URL = `http://localhost:${port}`;
  
  console.log('✅ Cypress baseUrl configured\n');
}

// Step 4: Wait for server to be ready
async function waitForServer(port) {
  console.log('⏳ Waiting for server to be ready...');
  
  const maxAttempts = 30;
  const delayMs = 1000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok || response.status === 404) {
        console.log('✅ Server is ready\n');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    process.stdout.write('.');
  }
  
  console.log('\n❌ Server did not become ready in time');
  return false;
}

// Step 5: Run Cypress
async function runCypress(mode = 'run', extraArgs = []) {
  console.log(`🧪 Running Cypress in ${mode} mode...\n`);
  
  return new Promise((resolve, reject) => {
    // Call cypress directly, not through pnpm script
    const cypressCmd = mode === 'open' ? 'open' : 'run';
    const args = [cypressCmd, ...extraArgs];
    
    const cypressProcess = spawn('npx', ['cypress', ...args], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env, // Pass through CYPRESS_BASE_URL
      },
    });
    
    cypressProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Tests completed successfully');
        resolve(code);
      } else {
        console.log(`\n❌ Tests failed with exit code ${code}`);
        resolve(code); // Still resolve to allow cleanup
      }
    });
    
    cypressProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Main execution
async function main() {
  let devProcess = null;
  let exitCode = 0;
  
  try {
    // Step 1: Ensure Supabase is running
    const supabaseReady = await ensureSupabaseRunning();
    if (!supabaseReady) {
      process.exit(1);
    }
    
    // Step 2: Start dev server and detect port
    const serverInfo = await startDevServer();
    devProcess = serverInfo.devProcess;
    const port = serverInfo.port;
    
    // Step 3: Set Cypress base URL
    await setCypressBaseUrl(port);
    
    // Step 4: Wait for server to be fully ready
    const serverReady = await waitForServer(port);
    if (!serverReady) {
      throw new Error('Server did not start properly');
    }
    
    // Step 5: Run Cypress
    const mode = isOpenMode ? 'open' : 'run';
    exitCode = await runCypress(mode, cypressArgs);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    exitCode = 1;
  } finally {
    // Cleanup: Kill dev server only if we started it
    if (devProcess) {
      console.log('\n🧹 Cleaning up dev server...');
      devProcess.kill('SIGTERM');
      
      // Give it a moment to shut down gracefully
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      try {
        devProcess.kill('SIGKILL');
      } catch (e) {
        // Already dead, ignore
      }
    } else {
      console.log('\n✅ Leaving existing dev server running');
    }
    
    console.log('✅ Cleanup complete\n');
    process.exit(exitCode);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted by user');
  process.exit(130);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
