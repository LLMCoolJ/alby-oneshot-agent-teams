# Specification 01: Project Setup

## Purpose

Define the project initialization, configuration files, and development environment setup for the Lightning Wallet Demo application.

## Dependencies

- [00-overview.md](./00-overview.md) - Architecture reference

## Package Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.0.2",
    "@getalby/sdk": "^7.0.0",
    "@getalby/lightning-tools": "^6.1.0",
    "qrcode.react": "^4.1.0",
    "express": "^4.21.1",
    "cors": "^2.8.5"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/node": "^22.9.0",
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^6.0.1",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "vitest": "^2.1.5",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "@playwright/test": "^1.48.2",
    "tsx": "^4.19.2",
    "concurrently": "^9.1.0"
  }
}
```

## Configuration Files

### package.json

```json
{
  "name": "lightning-wallet-demo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5741,
    proxy: {
      '/api': {
        target: 'http://localhost:3741',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["vite.config.ts", "server/**/*.ts"]
}
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Lightning-themed colors
        lightning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Bitcoin orange
        bitcoin: {
          DEFAULT: '#f7931a',
          dark: '#e8850f',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### .env.example

```env
# Server Configuration
PORT=3741
VITE_API_URL=http://localhost:3741

# Demo Wallet NWC URLs (optional)
# These enable "demo mode" with pre-configured wallets
VITE_ALICE_NWC_URL=
VITE_BOB_NWC_URL=

# Network Configuration
VITE_DEFAULT_NETWORK=testnet

# Feature Flags
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_FIAT_DISPLAY=true
VITE_DEFAULT_FIAT_CURRENCY=USD
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5741',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5741',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Initial Files

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/lightning.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lightning Wallet Demo - Alice & Bob</title>
    <meta name="description" content="Interactive Bitcoin Lightning Network demo using Alby SDK" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### src/main.tsx

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-background: 255 255 255;
    --color-foreground: 15 23 42;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-background: 15 23 42;
      --color-foreground: 248 250 252;
    }
  }

  body {
    @apply bg-slate-50 text-slate-900;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
}

@layer components {
  .btn-primary {
    @apply bg-bitcoin hover:bg-bitcoin-dark text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .input-field {
    @apply w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent;
  }

  .card {
    @apply bg-white rounded-xl shadow-sm border border-slate-200 p-4;
  }
}
```

### src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ALICE_NWC_URL?: string;
  readonly VITE_BOB_NWC_URL?: string;
  readonly VITE_DEFAULT_NETWORK: string;
  readonly VITE_ENABLE_DEMO_MODE: string;
  readonly VITE_ENABLE_FIAT_DISPLAY: string;
  readonly VITE_DEFAULT_FIAT_CURRENCY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### tests/setup.ts

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.subtle for tests
const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: vi.fn().mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
      // Return a mock 32-byte hash
      return new Uint8Array(32).buffer;
    }),
  },
};

vi.stubGlobal('crypto', mockCrypto);

// Mock WebSocket for NWC tests
vi.stubGlobal('WebSocket', vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})));
```

## Directory Creation Script

```bash
#!/bin/bash
# setup-project.sh

# Create directory structure
mkdir -p src/{components/{layout,wallet,transaction,ui},pages,hooks,context,lib,types}
mkdir -p server/routes
mkdir -p tests/{unit/{components,hooks,lib},integration,e2e,utils}
mkdir -p public

# Create placeholder files
touch src/App.tsx
touch src/types/index.ts
touch server/index.ts
touch server/routes/demo.ts

echo "Project structure created successfully!"
```

---

## Test Wallet Faucet

For E2E and integration testing, use the NWC test faucet at `https://faucet.nwc.dev` to create throw-away wallets. This enables true end-to-end testing against real NWC infrastructure without mocks.

### Faucet Features

- **Instant wallet creation** via single POST request
- **Pre-funded wallets** with configurable balance (in sats)
- **Full NWC support** including notifications and hold invoices
- **Isolated test environment** - wallets can transact with each other but not external Lightning network

### Creating a Test Wallet

```bash
# Create a wallet with 10,000 sats
curl -X POST "https://faucet.nwc.dev?balance=10000"

# Response: NWC connection string (plaintext)
# nostr+walletconnect://pubkey?relay=wss://...&secret=...&lud16=nwcXXXXXX@faucet.nwc.dev
```

### Topping Up a Wallet

```bash
# Add 1,000 sats to existing wallet (use the username from lud16)
curl -X POST "https://faucet.nwc.dev/wallets/nwcXXXXXX/topup?amount=1000"
```

### Test Wallet Utilities

**File**: `tests/utils/test-wallet.ts`

```typescript
/**
 * Creates a throw-away test wallet from the NWC faucet.
 * Each test can create fresh wallets for reproducible results.
 */
export async function createTestWallet(
  options: { balance?: number; retries?: number } = {}
): Promise<{ nwcUrl: string; lightningAddress: string }> {
  const { balance = 10000, retries = 3 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(
        `https://faucet.nwc.dev?balance=${balance}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw new Error(
          `Faucet request failed: ${response.status} ${await response.text()}`
        );
      }

      const nwcUrl = (await response.text()).trim();

      // Extract lightning address from lud16 parameter
      const lud16Match = nwcUrl.match(/lud16=([^&\s]+)/);
      if (!lud16Match) {
        throw new Error(`No lud16 found in NWC URL: ${nwcUrl}`);
      }

      const lightningAddress = decodeURIComponent(lud16Match[1]);

      return { nwcUrl, lightningAddress };
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error('Failed to create test wallet after retries');
}

/**
 * Top up an existing test wallet
 */
export async function topupTestWallet(
  lightningAddress: string,
  amount: number = 1000
): Promise<void> {
  const username = lightningAddress.split('@')[0];

  const response = await fetch(
    `https://faucet.nwc.dev/wallets/${username}/topup?amount=${amount}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error(`Topup failed: ${response.status} ${await response.text()}`);
  }
}

/**
 * Creates a pair of test wallets (Alice and Bob) for two-party scenarios
 */
export async function createTestWalletPair(
  options: { aliceBalance?: number; bobBalance?: number } = {}
): Promise<{
  alice: { nwcUrl: string; lightningAddress: string };
  bob: { nwcUrl: string; lightningAddress: string };
}> {
  const { aliceBalance = 10000, bobBalance = 10000 } = options;

  const [alice, bob] = await Promise.all([
    createTestWallet({ balance: aliceBalance }),
    createTestWallet({ balance: bobBalance }),
  ]);

  return { alice, bob };
}
```

### Usage in Tests

```typescript
// Playwright E2E test
import { createTestWalletPair } from '../utils/test-wallet';

test('Alice pays Bob', async ({ page }) => {
  const { alice, bob } = await createTestWalletPair();
  // Use alice.nwcUrl and bob.nwcUrl in your test...
});

// Vitest integration test
import { NWCClient } from '@getalby/sdk/nwc';
import { createTestWallet } from '../utils/test-wallet';

it('creates and pays invoice', async () => {
  const wallet = await createTestWallet({ balance: 10000 });
  const client = new NWCClient({ nostrWalletConnectUrl: wallet.nwcUrl });
  // Test with real NWC client...
  client.close();
}, 30000);
```

### Best Practices

1. **Fresh wallets per test** - Create new wallets for each test to ensure reproducibility
2. **Adequate timeouts** - NWC operations involve network calls; use 30s+ timeouts
3. **Cleanup** - Close NWC clients after tests to avoid resource leaks
4. **Parallel safety** - Each test creates its own wallets, so tests can run in parallel

---

## Test Requirements (TDD)

### Setup Test

**File**: `tests/unit/setup.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('has crypto.getRandomValues available', () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    expect(array.some(v => v !== 0)).toBe(true);
  });

  it('has crypto.subtle.digest available', async () => {
    const data = new TextEncoder().encode('test');
    const hash = await crypto.subtle.digest('SHA-256', data);
    expect(hash).toBeInstanceOf(ArrayBuffer);
  });

  it('has environment variables defined', () => {
    expect(import.meta.env.VITE_DEFAULT_NETWORK).toBeDefined();
  });
});
```

## Acceptance Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts both client and server
- [ ] `npm run build` produces production bundle
- [ ] `npm test` runs and passes setup tests
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Tailwind CSS classes are processed correctly
- [ ] Path aliases (`@/`) resolve correctly
- [ ] Environment variables are typed and accessible

## Implementation Notes

1. **Vite Proxy**: The dev server proxies `/api` requests to the Express backend, avoiding CORS issues
2. **Concurrent Dev**: Use `concurrently` to run both servers in development
3. **Path Aliases**: Use `@/` prefix for clean imports (e.g., `@/components/Button`)
4. **Test Globals**: Vitest globals enabled for cleaner test syntax

## Related Specifications

- [00-overview.md](./00-overview.md) - Architecture reference
- [15-backend.md](./15-backend.md) - Express server details
- [16-testing-strategy.md](./16-testing-strategy.md) - Testing approach
