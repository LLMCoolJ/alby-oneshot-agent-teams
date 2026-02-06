#!/usr/bin/env node
import { execSync } from 'child_process';
import http from 'http';

const SERVICES = ['lightning-wallet-dev', 'lightning-wallet-test'];
const ENDPOINTS = [
  { name: 'Express Backend', url: 'http://localhost:3741/health' },
  { name: 'Vite Dev Server', url: 'http://localhost:5741/' },
];

function checkService(serviceName) {
  try {
    const output = execSync(`systemctl --user is-active ${serviceName}.service`, {
      encoding: 'utf8',
    });
    return output.trim() === 'active';
  } catch (error) {
    return false;
  }
}

function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(endpoint.url, { timeout: 2000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('Lightning Wallet Demo - Health Check\n');
  console.log('═'.repeat(50));

  // Check systemd services
  console.log('\nSystemd Services:');
  for (const service of SERVICES) {
    const isActive = checkService(service);
    const status = isActive ? '✓ Active' : '✗ Inactive';
    console.log(`  ${service}: ${status}`);
  }

  // Check endpoints
  console.log('\nEndpoints:');
  for (const endpoint of ENDPOINTS) {
    const isHealthy = await checkEndpoint(endpoint);
    const status = isHealthy ? '✓ Healthy' : '✗ Unreachable';
    console.log(`  ${endpoint.name}: ${status}`);
  }

  console.log('\n' + '═'.repeat(50));
}

main();
