import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Process Management Setup', () => {
  describe('Service Files', () => {
    it('has development service file', () => {
      const devService = join(process.cwd(), 'systemd', 'lightning-wallet-dev.service');
      expect(existsSync(devService)).toBe(true);
    });

    it('has test service file', () => {
      const testService = join(process.cwd(), 'systemd', 'lightning-wallet-test.service');
      expect(existsSync(testService)).toBe(true);
    });
  });

  describe('Helper Scripts', () => {
    it('has setup-services script', () => {
      expect(existsSync('scripts/setup-services.js')).toBe(true);
    });

    it('has cleanup-processes script', () => {
      expect(existsSync('scripts/cleanup-processes.js')).toBe(true);
    });

    it('has health-check script', () => {
      expect(existsSync('scripts/health-check.js')).toBe(true);
    });

    it('has diagnose script', () => {
      expect(existsSync('scripts/diagnose.js')).toBe(true);
    });
  });

  describe('Package Scripts', () => {
    it('has systemd-related npm scripts', () => {
      const packageJson = JSON.parse(
        require('fs').readFileSync('package.json', 'utf8')
      );

      expect(packageJson.scripts).toHaveProperty('setup:services');
      expect(packageJson.scripts).toHaveProperty('dev:systemd');
      expect(packageJson.scripts).toHaveProperty('dev:systemd:stop');
      expect(packageJson.scripts).toHaveProperty('dev:systemd:status');
      expect(packageJson.scripts).toHaveProperty('dev:systemd:logs');
      expect(packageJson.scripts).toHaveProperty('cleanup:processes');
      expect(packageJson.scripts).toHaveProperty('health');
      expect(packageJson.scripts).toHaveProperty('diagnose');
    });
  });

  describe('Logs Directory', () => {
    it('has logs directory', () => {
      expect(existsSync('logs')).toBe(true);
    });

    it('logs directory is in .gitignore', () => {
      const gitignore = require('fs').readFileSync('.gitignore', 'utf8');
      expect(gitignore).toContain('logs/*.log');
    });
  });
});
