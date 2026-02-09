#!/usr/bin/env node

/**
 * Cypress E2E Test Runner
 *
 * Guarantees:
 * - Dev server is running
 * - Cypress uses the exact server URL selected by this runner
 * - When we start Next.js, we prefer the announced port from Next.js output
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rm } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const isOpenMode = args.includes('--open') || args.includes('-o');
const cypressArgs = args.filter((arg) => !['--open', '-o'].includes(arg));
const commonPorts = [3000, 3001, 3002, 3003, 3004, 3005];

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
      });
      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
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

async function isPortReady(port, timeout = 2500) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`http://localhost:${port}`, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

function extractAnnouncedPort(line) {
  const match = line.match(/Local:\s*https?:\/\/localhost:(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

async function detectRunningDevServerPort() {
  for (const port of commonPorts) {
    if (await isPortReady(port)) {
      return port;
    }
  }
  return null;
}

async function terminatePortProcess(port) {
  if (process.platform !== 'win32') {
    return false;
  }

  const command = `$p = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess; if ($p) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Output $p }`;
  const { code, stdout } = await runCommand('powershell', ['-NoProfile', '-Command', command], {
    silent: true,
  });

  return code === 0 && stdout.trim().length > 0;
}

async function terminateProcessById(pid) {
  if (!pid) return false;

  if (process.platform === 'win32') {
    const { code } = await runCommand('taskkill', ['/PID', String(pid), '/F'], { silent: true });
    return code === 0;
  }

  const { code } = await runCommand('kill', ['-9', String(pid)], { silent: true });
  return code === 0;
}

async function terminateStalePortProcesses() {
  let killedAny = false;
  for (const port of commonPorts) {
    const killed = await terminatePortProcess(port);
    if (killed) {
      killedAny = true;
      console.log(`[runner] Terminated stale process listening on port ${port}`);
    }
  }
  return killedAny;
}

async function isServerStableOnPort(port, attempts = 3) {
  let success = 0;
  for (let i = 0; i < attempts; i++) {
    if (await isPortReady(port, 4000)) {
      success += 1;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return success >= 2;
}

async function ensureSupabaseRunning() {
  console.log('Checking Supabase status...');

  const { code, stdout } = await runCommand('npx', ['supabase', 'status'], { silent: true });

  if (code === 0 && stdout.includes('API URL')) {
    console.log('Supabase is already running\n');
    return true;
  }

  console.log('Supabase not running, starting...\n');
  const { code: startCode } = await runCommand('npx', ['supabase', 'start']);

  if (startCode === 0) {
    console.log('\nSupabase started successfully\n');
    return true;
  }

  console.error('\nFailed to start Supabase');
  console.error('Please run "npx supabase start" manually\n');
  return false;
}

async function startDevServer(retryOnLock = true) {
  console.log('Checking for Next.js dev server...');

  const existingPort = await detectRunningDevServerPort();
  if (existingPort) {
    const stable = await isServerStableOnPort(existingPort);
    if (stable) {
      console.log(`Dev server already running on port ${existingPort}\n`);
      return { devProcess: null, port: existingPort, portSource: 'existing' };
    }
    console.log(`Found existing process on port ${existingPort}, but it is not stable. Starting a fresh dev server...`);
    const killed = await terminatePortProcess(existingPort);
    if (killed) {
      console.log(`[runner] Cleared stale listener on port ${existingPort}`);
    }
  }

  console.log('Starting Next.js dev server...');
  console.log('Server output will appear below:\n');
  console.log('-'.repeat(60));

  const devProcess = spawn('pnpm', ['dev'], {
    cwd: projectRoot,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let announcedPort = null;
  let startupConflictSeen = false;
  let devExited = false;
  const occupiedProcessIds = new Set();

  const handleDevLine = (line) => {
    if (!line.trim()) return;

    const maybePort = extractAnnouncedPort(line);
    if (maybePort) {
      announcedPort = maybePort;
    }

    const pidMatch = line.match(/Port\s+\d+\s+is in use by process\s+(\d+)/i);
    if (pidMatch) {
      const pid = Number.parseInt(pidMatch[1], 10);
      if (Number.isFinite(pid)) {
        occupiedProcessIds.add(pid);
      }
    }

    if (
      line.includes('Unable to acquire lock') ||
      line.includes('acquire and acquire the lockfile') ||
      line.includes('acquire the lockfile') ||
      line.includes('Access is denied')
    ) {
      startupConflictSeen = true;
    }

    console.log(`[next] ${line}`);
  };

  devProcess.stdout.on('data', (data) => {
    data
      .toString()
      .split('\n')
      .forEach(handleDevLine);
  });

  devProcess.stderr.on('data', (data) => {
    data
      .toString()
      .split('\n')
      .forEach(handleDevLine);
  });

  devProcess.on('exit', () => {
    devExited = true;
  });

  console.log('[runner] Waiting for dev server to be ready...\n');

  const maxWait = 90_000;
  const checkInterval = 1_000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    if (devExited) break;

    if (announcedPort && (await isPortReady(announcedPort))) {
      console.log('-'.repeat(60));
      console.log(`\nDev server ready on announced port ${announcedPort}\n`);
      return { devProcess, port: announcedPort, portSource: 'announced' };
    }

    await new Promise((r) => setTimeout(r, checkInterval));
  }

  if (startupConflictSeen) {
    const detectedPort = await detectRunningDevServerPort();
    if (detectedPort && (await isServerStableOnPort(detectedPort))) {
      console.log('-'.repeat(60));
      console.log(`\nNext.js lock detected; using existing server on port ${detectedPort}\n`);
      return { devProcess: null, port: detectedPort, portSource: 'existing-after-lock' };
    }

    if (retryOnLock) {
      for (const pid of occupiedProcessIds) {
        const killed = await terminateProcessById(pid);
        if (killed) {
          console.log(`[runner] Terminated conflicting process ${pid}`);
        }
      }
      await terminateStalePortProcesses();
      const lockPath = join(projectRoot, '.next', 'dev', 'lock');
      try {
        await rm(lockPath, { force: true });
        console.log(`[runner] Removed stale lock at ${lockPath}`);
        console.log('[runner] Retrying dev server startup once...');
        return startDevServer(false);
      } catch (error) {
        console.log(`[runner] Failed to remove lock file: ${error.message}`);
      }
    }
  }

  console.log('-'.repeat(60));
  throw new Error('Could not detect a healthy Next.js dev server port');
}

async function waitForServerStable(port) {
  console.log(`Ensuring server on port ${port} is stable...`);

  let successCount = 0;
  const maxAttempts = 12;

  for (let i = 0; i < maxAttempts && successCount < 2; i++) {
    if (await isPortReady(port, 4_000)) {
      successCount++;
      if (successCount < 2) {
        await new Promise((r) => setTimeout(r, 700));
      }
    } else {
      successCount = 0;
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }

  if (successCount >= 2) {
    console.log('Server is stable\n');
    return true;
  }

  console.log('Server did not become stable\n');
  return false;
}

async function runCypress(baseUrl, mode = 'run', extraArgs = []) {
  console.log(`Running Cypress in ${mode} mode...`);
  console.log(`Base URL: ${baseUrl}`);
  if (extraArgs.length > 0) {
    console.log(`Extra args: ${extraArgs.join(' ')}`);
  }
  console.log('');
  console.log('='.repeat(60));
  console.log('                      CYPRESS OUTPUT');
  console.log('='.repeat(60) + '\n');

  return new Promise((resolve) => {
    const cypressCmd = mode === 'open' ? 'open' : 'run';
    const cypressEnv = {
      ...process.env,
      CYPRESS_BASE_URL: baseUrl,
    };
    // Cypress Electron app must not run with this flag enabled.
    delete cypressEnv.ELECTRON_RUN_AS_NODE;

    const cypressProcess = spawn('npx', ['cypress', cypressCmd, ...extraArgs], {
      cwd: projectRoot,
      shell: true,
      stdio: 'inherit',
      env: cypressEnv,
    });

    cypressProcess.on('close', (code) => {
      console.log('\n' + '='.repeat(60));
      if (code === 0) {
        console.log('Cypress tests completed successfully');
      } else {
        console.log(`Cypress tests failed with exit code ${code}`);
      }
      console.log('='.repeat(60) + '\n');
      resolve(code);
    });

    cypressProcess.on('error', (error) => {
      console.error('Failed to start Cypress:', error.message);
      resolve(1);
    });
  });
}

async function main() {
  console.log('');
  console.log('+' + '-'.repeat(58) + '+');
  console.log('|' + ' '.repeat(17) + 'E2E TEST RUNNER' + ' '.repeat(26) + '|');
  console.log('+' + '-'.repeat(58) + '+');
  console.log('');

  let devProcess = null;
  let exitCode = 0;

  try {
    const supabaseReady = await ensureSupabaseRunning();
    if (!supabaseReady) process.exit(1);

    const serverInfo = await startDevServer();
    devProcess = serverInfo.devProcess;
    const port = serverInfo.port;
    const baseUrl = `http://localhost:${port}`;

    if (serverInfo.portSource === 'announced') {
      console.log(`[runner] Cypress will run against announced dev server port: ${port}`);
    } else {
      console.log(`[runner] Cypress will run against detected dev server port: ${port}`);
    }

    const stable = await waitForServerStable(port);
    if (!stable) {
      throw new Error(`Dev server on port ${port} is not stable`);
    }

    const mode = isOpenMode ? 'open' : 'run';
    exitCode = await runCypress(baseUrl, mode, cypressArgs);
  } catch (error) {
    console.error('\nError:', error.message);
    console.error(error.stack);
    exitCode = 1;
  } finally {
    console.log('Cleaning up...');

    if (devProcess) {
      console.log('Stopping dev server...');
      devProcess.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 1000));
      try {
        devProcess.kill('SIGKILL');
      } catch {
        // Already dead.
      }
      console.log('Dev server stopped');
    } else {
      console.log('Leaving existing dev server running');
    }

    console.log('Done\n');
    process.exit(exitCode);
  }
}

process.on('SIGINT', () => {
  console.log('\n\nInterrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\nTerminated');
  process.exit(143);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
