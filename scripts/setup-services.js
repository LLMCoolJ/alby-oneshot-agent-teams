#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HOME = homedir();
const SYSTEMD_USER_DIR = join(HOME, '.config', 'systemd', 'user');
const PROJECT_ROOT = join(__dirname, '..');
const SYSTEMD_SOURCE_DIR = join(PROJECT_ROOT, 'systemd');

// Service files to install
const SERVICES = ['lightning-wallet-dev.service', 'lightning-wallet-test.service'];

function main() {
  console.log('Setting up systemd user services...\n');

  // Ensure systemd user directory exists
  if (!existsSync(SYSTEMD_USER_DIR)) {
    console.log(`Creating directory: ${SYSTEMD_USER_DIR}`);
    mkdirSync(SYSTEMD_USER_DIR, { recursive: true });
  }

  // Copy each service file
  for (const service of SERVICES) {
    const sourcePath = join(SYSTEMD_SOURCE_DIR, service);
    const destPath = join(SYSTEMD_USER_DIR, service);

    if (!existsSync(sourcePath)) {
      console.error(`ERROR: Service file not found: ${sourcePath}`);
      process.exit(1);
    }

    // Read service file and replace %h with actual home directory
    let content = readFileSync(sourcePath, 'utf8');
    content = content.replace(/%h/g, HOME);

    // Replace project path placeholder if present
    content = content.replace(/WorkingDirectory=.*/, `WorkingDirectory=${PROJECT_ROOT}`);

    // Write to systemd user directory
    writeFileSync(destPath, content);
    console.log(`✓ Installed: ${service}`);
  }

  console.log('\nReloading systemd daemon...');
  const { execSync } = await import('child_process');
  try {
    execSync('systemctl --user daemon-reload', { stdio: 'inherit' });
    console.log('✓ Daemon reloaded\n');
  } catch (error) {
    console.error('ERROR: Failed to reload systemd daemon');
    console.error('Run manually: systemctl --user daemon-reload');
    process.exit(1);
  }

  console.log('Setup complete!\n');
  console.log('Usage:');
  console.log('  Start dev server:  systemctl --user start lightning-wallet-dev.service');
  console.log('  Stop dev server:   systemctl --user stop lightning-wallet-dev.service');
  console.log('  Check status:      systemctl --user status lightning-wallet-dev.service');
  console.log('  View logs:         journalctl --user -u lightning-wallet-dev.service -f\n');
}

main();
