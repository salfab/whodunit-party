#!/usr/bin/env node

/**
 * Cypress E2E Test Runner
 * 
 * This script:
 * 1. Ensures Supabase is running (starts it if needed)
 * 2. Starts the Next.js dev server (or uses existing one)
 * 3. Detects the port the server is running on
 * 4. Runs Cypress tests with full output visibility
 * 5. Cleans up after tests
 * 
 * All output from both the dev server and Cypress is streamed
 * to the console for easy debugging.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const isOpenMode = args.includes('--open') || args.includes('-o');
const cypressArgs = args.filter(arg => !['--open', '-o'].includes(arg));

// Helper to run a command and optionally capture/stream output
function runCommand(command, cmdArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, cmdArgs, {
      cwd: projectRoot,
      shell: true,
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (options.streamPrefix) {
          data.toString().split('\n').forEach(line => {
            if (line.trim()) console.log(`${options.streamPrefix} ${line}`);
          });
        }
      });
      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
        if (options.streamPrefix) {
          data.toString().split('\n').forEach(line => {
            if (line.trim()) console.log(`${options.streamPrefix} ${line}`);
          });
        }
      });
    }

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr, process: proc });
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

// Helper to check if a port is responding
async function isPortReady(port, timeout = 2000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(`http://localhost:${port}`, { 
      method: 'HEAD',
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

// Step 1: Check/Start Supabase
async function ensureSupabaseRunning() {
  console.log('📦 Checking Supabase status...');
  
  const { code, stdout } = await runCommand('npx', ['supabase', 'status'], { silent: true });
  
  if (code === 0 && stdout.includes('API URL')) {
    console.log('✅ Supabase is already running\n');
    return true;
  }
  
  // Supabase not running, try to start it
  console.log('⏳ Supabase not running, starting...');
  console.log('   (This may take a minute on first run)\n');
  
  // Stream Supabase output so user can see progress
  const { code: startCode } = await runCommand('npx', ['supabase', 'start']);
  
  if (startCode === 0) {
    console.log('\n✅ Supabase started successfully\n');
    return true;
  }
  
  console.error('\n❌ Failed to start Supabase');
  console.error('   Please run "npx supabase start" manually\n');
  return false;
}

// Step 2: Find existing server or start a new one
async function startDevServer() {
  console.log('🔧 Checking for Next.js dev server...');
  
  const commonPorts = [3000, 3001, 3002, 3003];
  
  // Check if a server is already running
  for (const port of commonPorts) {
    if (await isPortReady(port)) {
      console.log(`✅ Dev server already running on port ${port}\n`);
      return { devProcess: null, port };
    }
  }
  
  // No server found, start a new one
  console.log('⏳ Starting Next.js dev server...');
  console.log('   Server output will appear below:\n');
  console.log('─'.repeat(60));
  
  const devProcess = spawn('pnpm', ['dev'], {
    cwd: projectRoot,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Stream dev server output with prefix for clarity
  devProcess.stdout.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) console.log(`[next] ${line}`);
    });
  });

  devProcess.stderr.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) console.log(`[next] ${line}`);
    });
  });

  // Wait for server to start and detect port
  console.log('[runner] Waiting for dev server to be ready...\n');
  
  const maxWait = 60000; // 60 seconds
  const checkInterval = 1000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    for (const port of commonPorts) {
      if (await isPortReady(port)) {
        console.log('─'.repeat(60));
        console.log(`\n✅ Dev server ready on port ${port}\n`);
        return { devProcess, port };
      }
    }
    await new Promise(r => setTimeout(r, checkInterval));
  }
  
  console.log('─'.repeat(60));
  console.log('\n⚠️  Could not detect dev server port, defaulting to 3000\n');
  return { devProcess, port: 3000 };
}

// Step 3: Wait for server to be fully ready (handles slow startup)
async function waitForServerStable(port) {
  console.log(`⏳ Ensuring server on port ${port} is stable...`);
  
  // Make 2 successful requests to ensure stability
  let successCount = 0;
  const maxAttempts = 10;
  
  for (let i = 0; i < maxAttempts && successCount < 2; i++) {
    if (await isPortReady(port, 3000)) {
      successCount++;
      if (successCount < 2) {
        await new Promise(r => setTimeout(r, 500));
      }
    } else {
      successCount = 0;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  if (successCount >= 2) {
    console.log('✅ Server is stable\n');
    return true;
  }
  
  console.log('⚠️  Server may be unstable, proceeding anyway\n');
  return true;
}

// Step 4: Run Cypress
async function runCypress(port, mode = 'run', extraArgs = []) {
  console.log(`🧪 Running Cypress in ${mode} mode...`);
  console.log(`   Base URL: http://localhost:${port}`);
  if (extraArgs.length > 0) {
    console.log(`   Extra args: ${extraArgs.join(' ')}`);
  }
  console.log('');
  console.log('═'.repeat(60));
  console.log('                      CYPRESS OUTPUT');
  console.log('═'.repeat(60) + '\n');

  return new Promise((resolve) => {
    const cypressCmd = mode === 'open' ? 'open' : 'run';
    
    // Use stdio: inherit so Cypress output goes directly to console
    const cypressProcess = spawn('npx', ['cypress', cypressCmd, ...extraArgs], {
      cwd: projectRoot,
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        CYPRESS_BASE_URL: `http://localhost:${port}`,
      },
    });

    cypressProcess.on('close', (code) => {
      console.log('\n' + '═'.repeat(60));
      if (code === 0) {
        console.log('✅ Cypress tests completed successfully');
      } else {
        console.log(`❌ Cypress tests failed with exit code ${code}`);
      }
      console.log('═'.repeat(60) + '\n');
      resolve(code);
    });

    cypressProcess.on('error', (error) => {
      console.error('Failed to start Cypress:', error.message);
      resolve(1);
    });
  });
}

// Main execution
async function main() {
  console.log('');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(17) + 'E2E TEST RUNNER' + ' '.repeat(26) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');

  let devProcess = null;
  let exitCode = 0;

  try {
    // Step 1: Ensure Supabase is running
    const supabaseReady = await ensureSupabaseRunning();
    if (!supabaseReady) {
      process.exit(1);
    }

    // Step 2: Start dev server or find existing one
    const serverInfo = await startDevServer();
    devProcess = serverInfo.devProcess;
    const port = serverInfo.port;

    // Step 3: Wait for server to be stable
    await waitForServerStable(port);

    // Step 4: Run Cypress
    const mode = isOpenMode ? 'open' : 'run';
    exitCode = await runCypress(port, mode, cypressArgs);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    exitCode = 1;
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up...');
    
    if (devProcess) {
      console.log('   Stopping dev server...');
      devProcess.kill('SIGTERM');
      
      // Give it time to shut down gracefully
      await new Promise(r => setTimeout(r, 1000));
      
      try {
        devProcess.kill('SIGKILL');
      } catch {
        // Already dead, ignore
      }
      console.log('   Dev server stopped');
    } else {
      console.log('   Leaving existing dev server running');
    }

    console.log('✅ Done\n');
    process.exit(exitCode);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Terminated');
  process.exit(143);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
