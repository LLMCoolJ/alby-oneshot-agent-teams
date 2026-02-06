#!/usr/bin/env node
import { execSync } from 'child_process';

const PORTS = [3741, 5741];

function findProcessDetails(port) {
  try {
    const output = execSync(`lsof -i:${port} -n -P`, { encoding: 'utf8' });
    return output;
  } catch (error) {
    return null;
  }
}

function getServiceStatus(serviceName) {
  try {
    const output = execSync(`systemctl --user status ${serviceName}.service`, {
      encoding: 'utf8',
    });
    return output;
  } catch (error) {
    return error.stdout || 'Service not found or not running';
  }
}

function main() {
  console.log('Lightning Wallet Demo - Diagnostic Report\n');
  console.log('═'.repeat(70));

  // Check ports
  console.log('\n1. Port Usage:\n');
  for (const port of PORTS) {
    console.log(`Port ${port}:`);
    const details = findProcessDetails(port);
    if (details) {
      console.log(details);
    } else {
      console.log(`  No process listening on port ${port}\n`);
    }
  }

  // Check services
  console.log('2. Service Status:\n');
  const services = ['lightning-wallet-dev', 'lightning-wallet-test'];
  for (const service of services) {
    console.log(`${service}.service:`);
    const status = getServiceStatus(service);
    console.log(status);
    console.log('─'.repeat(70));
  }

  // Check for orphaned node processes
  console.log('\n3. Node Processes:\n');
  try {
    const output = execSync('ps aux | grep -E "(node|npm|vite|tsx)" | grep -v grep', {
      encoding: 'utf8',
    });
    console.log(output || 'No Node.js processes found');
  } catch (error) {
    console.log('No Node.js processes found');
  }

  console.log('\n═'.repeat(70));
  console.log('\nRecommended Actions:');
  console.log('  - If ports are in use: npm run cleanup:processes');
  console.log('  - To restart services: systemctl --user restart lightning-wallet-dev.service');
  console.log('  - To view logs: npm run dev:systemd:logs');
}

main();
