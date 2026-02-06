# Specification 02: Process Management

## Purpose

Define a systemd-based process management system that prevents orphaned processes when running the Lightning Wallet Demo application in development and test modes. This spec ensures that all child processes (Vite dev server, Express backend) are properly tracked and terminated when the parent process exits.

## Dependencies

- [01-project-setup.md](./01-project-setup.md) - Project configuration and scripts

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          systemd User Services                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  lightning-wallet-dev.service                                      │  │
│  │  - Runs: npm run dev (via concurrently)                           │  │
│  │  - Child processes: Vite (5741) + Express (3741)                  │  │
│  │  - KillMode=control-group (kills all descendants)                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  lightning-wallet-test.service                                     │  │
│  │  - Runs: npm test (watch mode)                                    │  │
│  │  - KillMode=control-group                                         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Helper Scripts                                  │
│  - setup-services.js    : Install systemd service files                 │
│  - cleanup-processes.js : Emergency process cleanup                     │
│  - health-check.js      : Check service health                          │
│  - diagnose.js          : Debug port conflicts and orphans             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Service Files

### Development Service

**File**: `systemd/lightning-wallet-dev.service`

```ini
[Unit]
Description=Lightning Wallet Demo - Development Server
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/src/alby-oneshot-v5
ExecStart=/usr/bin/npm run dev
Restart=on-failure
RestartSec=5

# Process management - kills all child processes
KillMode=control-group
KillSignal=SIGTERM
TimeoutStopSec=30

# Environment
Environment=NODE_ENV=development
Environment=PORT=3741
Environment=VITE_API_URL=http://localhost:3741

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lightning-wallet-dev

[Install]
WantedBy=default.target
```

### Test Service

**File**: `systemd/lightning-wallet-test.service`

```ini
[Unit]
Description=Lightning Wallet Demo - Test Runner
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/src/alby-oneshot-v5
ExecStart=/usr/bin/npm test
Restart=on-failure
RestartSec=5

# Process management - kills all child processes
KillMode=control-group
KillSignal=SIGTERM
TimeoutStopSec=30

# Environment
Environment=NODE_ENV=test

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lightning-wallet-test

[Install]
WantedBy=default.target
```

## Helper Scripts

### Setup Services Script

**File**: `scripts/setup-services.js`

```javascript
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
```

### Cleanup Processes Script

**File**: `scripts/cleanup-processes.js`

```javascript
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
```

### Health Check Script

**File**: `scripts/health-check.js`

```javascript
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
```

### Diagnose Script

**File**: `scripts/diagnose.js`

```javascript
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
```

## Logging Strategy

### Log Locations

Systemd services log to the systemd journal:

```bash
# View dev server logs (follow mode)
journalctl --user -u lightning-wallet-dev.service -f

# View test runner logs
journalctl --user -u lightning-wallet-test.service -f

# View logs from the last hour
journalctl --user -u lightning-wallet-dev.service --since "1 hour ago"

# View logs with specific priority
journalctl --user -u lightning-wallet-dev.service -p err
```

### Application Logs

Create a `logs/` directory for application-specific logs that need persistence:

```
logs/
├── app.log           # Application logs (if needed)
├── error.log         # Error logs
└── .gitkeep          # Keep directory in git
```

**File**: `.gitignore` (additions)

```
# Logs
logs/*.log
!logs/.gitkeep
```

## Process Lifecycle

### Starting Development Server

```bash
# Method 1: Using systemd (recommended)
npm run dev:systemd

# Method 2: Direct npm command (for development without systemd)
npm run dev

# Check status
npm run dev:systemd:status

# View logs
npm run dev:systemd:logs
```

### Stopping Development Server

```bash
# Graceful shutdown via systemd
npm run dev:systemd:stop

# Force cleanup if needed
npm run cleanup:processes
```

### Process Hierarchy

```
systemd (PID 1)
└── lightning-wallet-dev.service
    └── npm run dev (shell)
        └── concurrently
            ├── npm run dev:client → vite (port 5741)
            └── npm run dev:server → tsx watch server/index.ts (port 3741)
```

When the service is stopped:
1. systemd sends SIGTERM to npm process
2. `KillMode=control-group` ensures all child processes receive SIGTERM
3. After 30 seconds (`TimeoutStopSec=30`), systemd sends SIGKILL to any remaining processes

## Developer Workflow

### First-Time Setup

```bash
# 1. Install service files
npm run setup:services

# 2. Start development server
npm run dev:systemd

# 3. Open browser
# http://localhost:5741
```

### Daily Development

```bash
# Start/stop as needed
npm run dev:systemd
npm run dev:systemd:stop

# Check health
npm run health

# If things go wrong
npm run diagnose
npm run cleanup:processes
```

### Troubleshooting

```bash
# Port already in use?
npm run cleanup:processes

# Service won't start?
npm run diagnose

# Check systemd logs
npm run dev:systemd:logs

# Manual service control
systemctl --user status lightning-wallet-dev.service
systemctl --user restart lightning-wallet-dev.service
```

## Application Changes

### Server Graceful Shutdown

Update `server/index.ts` to handle SIGTERM:

```typescript
// ... existing server code ...

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.isDev ? 'development' : 'production'}`);
});

// Graceful shutdown handler
function shutdown(signal: string) {
  console.log(`\n${signal} received. Closing server gracefully...`);

  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }

    console.log('Server closed successfully.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Register signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### No Changes Required

The following already work correctly with systemd:
- **Vite dev server**: Handles SIGTERM gracefully
- **tsx watch**: Properly terminates on signal
- **concurrently**: Forwards signals to child processes

## Test Requirements (TDD)

### Setup Test

**File**: `tests/unit/process-management.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('Process Management Setup', () => {
  const SYSTEMD_USER_DIR = join(homedir(), '.config', 'systemd', 'user');

  describe('Service Files', () => {
    it('has development service file', () => {
      const devService = join(SYSTEMD_USER_DIR, 'lightning-wallet-dev.service');
      expect(existsSync(devService)).toBe(true);
    });

    it('has test service file', () => {
      const testService = join(SYSTEMD_USER_DIR, 'lightning-wallet-test.service');
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
```

### Integration Test

**File**: `tests/integration/systemd-lifecycle.test.ts`

```typescript
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
      resolve(res.statusCode >= 200 && res.statusCode < 400);
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
```

## Acceptance Criteria

- [ ] Service files exist in `systemd/` directory
- [ ] Setup script creates service files in `~/.config/systemd/user/`
- [ ] Development server starts via `npm run dev:systemd`
- [ ] Both Vite and Express servers start correctly
- [ ] Services can be stopped via `npm run dev:systemd:stop`
- [ ] All child processes are terminated when service stops
- [ ] No orphaned processes remain on ports 3741 or 5741
- [ ] Health check script reports accurate status
- [ ] Diagnose script identifies port conflicts
- [ ] Cleanup script can kill orphaned processes
- [ ] Logs are accessible via `journalctl`
- [ ] Server handles SIGTERM gracefully
- [ ] All tests pass

## Troubleshooting

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Port already in use | Run `npm run diagnose` | Run `npm run cleanup:processes` |
| Service won't start | Check `npm run dev:systemd:status` | Check logs with `npm run dev:systemd:logs` |
| Service won't stop | Check `systemctl --user status` | Force stop: `systemctl --user kill lightning-wallet-dev.service` |
| Changes not reflected | Service is caching | Restart: `systemctl --user restart lightning-wallet-dev.service` |
| systemctl not found | systemd not installed | Install systemd or use `npm run dev` directly |

### Manual Service Management

```bash
# Reload daemon after editing service files
systemctl --user daemon-reload

# Enable service to start on login
systemctl --user enable lightning-wallet-dev.service

# Disable auto-start
systemctl --user disable lightning-wallet-dev.service

# View service logs with filtering
journalctl --user -u lightning-wallet-dev.service --since today

# Follow logs in real-time
journalctl --user -u lightning-wallet-dev.service -f -n 50
```

## Implementation Notes (Common Pitfalls)

These lessons were learned during initial implementation and should be watched for in any re-implementation:

### 1. Canonical Constants — Define Once, Reference Everywhere

The following values must be consistent across ALL files (service templates, helper scripts, spec prose, tests, package.json):

| Constant | Value | Where Referenced |
|----------|-------|------------------|
| Backend port | `3741` | server/config.ts, all scripts, service templates, tests |
| Frontend port | `5741` | vite config, all scripts, tests |
| Dev service name | `alby-demo-dev.service` | service template filename, all scripts, package.json |
| Test service name | `alby-demo-test.service` | service template filename, all scripts, package.json |
| Template variables | `{{PROJECT_ROOT}}`, `{{USER}}`, `{{NVM_DIR}}` | service templates, install script |

Port numbers and service names easily drift when different files are written independently. Always grep all scripts/templates for port references before finalizing.

### 2. Systemd User Services vs System Services

User services (`systemctl --user`) have different conventions than system services:
- Use `WantedBy=default.target`, **NOT** `WantedBy=multi-user.target`
- `multi-user.target` is for system-wide services and will cause silent failures for user units
- The `User=` directive is unnecessary in user services (it's always the current user)

### 3. NVM-Managed Node.js Requires Shell Wrapping

When Node.js is installed via nvm, `npm` and `node` are not on the system PATH. Systemd services cannot find them with a bare `ExecStart=/usr/bin/npm ...`.

**Must use**:
```ini
ExecStart=/bin/bash -c 'source {{NVM_DIR}}/nvm.sh && npm run dev'
```

**Will fail silently**:
```ini
ExecStart=/usr/bin/npm run dev
```

### 4. Template Variable Substitution Must Be Exhaustive

The install script must substitute ALL template variables. A partial substitution (e.g., replacing `{{PROJECT_ROOT}}` but forgetting `{{NVM_DIR}}`) will produce a service file that appears valid but fails at runtime with cryptic errors.

The install script should substitute all three in a single `sed` pipeline:
```bash
sed -e "s|{{PROJECT_ROOT}}|$PROJECT_DIR|g" \
    -e "s|{{USER}}|$USER|g" \
    -e "s|{{NVM_DIR}}|$NVM_DIR|g" \
    "$template" > "$service_file"
```

### 5. Logging Strategy: Choose File-Based OR Journal, Not Both

Two approaches exist — pick one and be consistent:

| Approach | Service Config | Script Access |
|----------|---------------|---------------|
| **File-based** (chosen) | `StandardOutput=append:{{PROJECT_ROOT}}/logs/dev-stdout.log` | `tail -f logs/dev-stdout.log` |
| **Journal-based** | `StandardOutput=journal` | `journalctl --user -u service-name -f` |

If using file-based logging, the `logs` and `errors` commands in helper scripts must use `tail -f` on log files. If using journal-based, they must use `journalctl`. Mixing the two means one approach silently shows nothing.

### 6. Helper Scripts: Shell (`.sh`) vs Node (`.js`)

Shell scripts are preferred for process management because:
- They work without Node.js being on PATH (the whole point is managing Node processes)
- `lsof`, `pgrep`, `kill`, `systemctl` are native shell operations
- No module resolution or ESM issues

Package.json scripts should reference `./scripts/dev.sh start`, not `node scripts/dev.js`.

### 7. Script `errors` Command

The `dev.sh` and `test.sh` scripts should support an `errors` subcommand in addition to `logs`, since systemd separates stdout and stderr into different log files. Forgetting this means stderr output is invisible during debugging.

### 8. Stop Command Should Verify Port Release

After `systemctl --user stop`, ports may not be immediately released (especially if child processes ignore SIGTERM). The `stop` subcommand should verify ports are actually freed and call the cleanup script as a fallback:

```bash
stop_server() {
    systemctl --user stop "$SERVICE_NAME"
    sleep 1
    # Verify ports are actually released
    if lsof -ti:5741 || lsof -ti:3741; then
        echo "Ports still in use, running cleanup..."
        "$SCRIPT_DIR/cleanup.sh"
    fi
}
```

## Related Specifications

- [01-project-setup.md](./01-project-setup.md) - Project configuration and npm scripts
- [15-backend.md](./15-backend.md) - Express server implementation
- [16-testing-strategy.md](./16-testing-strategy.md) - Testing approach
