#!/usr/bin/env node
import { execSync } from 'child_process';

const PORTS = [3741, 5741]; // Express and Vite ports

function findProcessOnPort(port) {
  try {
    const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // No process found on port
    return [];
  }
}

function killProcess(pid) {
  try {
    process.kill(parseInt(pid), 'SIGTERM');
    console.log(`✓ Killed process ${pid}`);
    return true;
  } catch (error) {
    // Process may have already exited
    return false;
  }
}

function main() {
  console.log('Cleaning up orphaned processes...\n');

  let found = false;

  for (const port of PORTS) {
    const pids = findProcessOnPort(port);

    if (pids.length > 0) {
      found = true;
      console.log(`Port ${port}: Found ${pids.length} process(es)`);

      for (const pid of pids) {
        killProcess(pid);
      }
    }
  }

  if (!found) {
    console.log('No orphaned processes found.');
  }

  console.log('\nCleanup complete.');
}

main();
