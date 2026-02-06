import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import http from 'http';

describe('Systemd Lifecycle', () => {
  beforeAll(() => {
    // Ensure services are set up
    execSync('npm run setup:services', { stdio: 'inherit' });
  });

  afterAll(() => {
    // Clean up
    try {
      execSync('systemctl --user stop lightning-wallet-dev.service', {
        stdio: 'ignore',
      });
    } catch (error) {
      // Service may not be running
    }
  });

  it('can start development service', () => {
    execSync('systemctl --user start lightning-wallet-dev.service');

    const status = execSync('systemctl --user is-active lightning-wallet-dev.service', {
      encoding: 'utf8',
    });

    expect(status.trim()).toBe('active');
  }, 30000);

  it('can check service status', () => {
    const status = execSync('systemctl --user status lightning-wallet-dev.service', {
      encoding: 'utf8',
    });

    expect(status).toContain('Active: active');
  });

  it('starts servers on correct ports', async () => {
    // Wait for services to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check Vite
    const viteHealthy = await checkEndpoint('http://localhost:5741');
    expect(viteHealthy).toBe(true);

    // Check Express
    const expressHealthy = await checkEndpoint('http://localhost:3741/health');
    expect(expressHealthy).toBe(true);
  }, 30000);

  it('can stop development service', () => {
    execSync('systemctl --user stop lightning-wallet-dev.service');

    const status = execSync('systemctl --user is-active lightning-wallet-dev.service', {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();

    expect(status).not.toBe('active');
  }, 30000);

  it('kills all child processes on stop', async () => {
    // Start service
    execSync('systemctl --user start lightning-wallet-dev.service');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Stop service
    execSync('systemctl --user stop lightning-wallet-dev.service');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check ports are free
    const port3741Free = await isPortFree(3741);
    const port5741Free = await isPortFree(5741);

    expect(port3741Free).toBe(true);
    expect(port5741Free).toBe(true);
  }, 60000);
});

function checkEndpoint(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      resolve((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
      resolve(false); // Port is in use
    } catch (error) {
      resolve(true); // Port is free
    }
  });
}
