# Specification 15: Backend Server

## Purpose

Define the Express.js backend server that can optionally handle server-side NWC operations and provide demo wallet connections.

## Dependencies

- [01-project-setup.md](./01-project-setup.md) - Project configuration

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Backend Server                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js Server                             │   │
│  │                    Port: 3741                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│          ┌───────────────────┼───────────────────┐                     │
│          ▼                   ▼                   ▼                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐              │
│  │   /health    │   │  /api/demo   │   │   /api/...   │              │
│  │              │   │   /wallets   │   │   (future)   │              │
│  │  Health      │   │              │   │              │              │
│  │  check       │   │  Demo NWC    │   │  Additional  │              │
│  │              │   │  URLs        │   │  endpoints   │              │
│  └──────────────┘   └──────────────┘   └──────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Current Scope

For the demo application, the backend is minimal:

1. **Health check endpoint** - For deployment monitoring
2. **Demo wallet configuration** - Provide pre-configured NWC URLs for demo mode
3. **CORS handling** - Allow frontend requests

Most NWC operations happen client-side via WebSocket connections to Nostr relays.

---

## Server Implementation

**File**: `server/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { demoRouter } from './routes/demo';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/demo', demoRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.isDev ? err.message : undefined,
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.isDev ? 'development' : 'production'}`);
});
```

---

## Configuration

**File**: `server/config.ts`

```typescript
export const config = {
  port: parseInt(process.env.PORT || '3741', 10),
  isDev: process.env.NODE_ENV !== 'production',

  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5741',
    'http://localhost:3000',
  ],

  // Demo wallet NWC URLs (optional)
  demoWallets: {
    alice: process.env.ALICE_NWC_URL || null,
    bob: process.env.BOB_NWC_URL || null,
  },

  // Feature flags
  enableDemoMode: process.env.ENABLE_DEMO_MODE === 'true',
};
```

---

## Routes

### Demo Wallets Route

**File**: `server/routes/demo.ts`

```typescript
import { Router } from 'express';
import { config } from '../config';

export const demoRouter = Router();

/**
 * GET /api/demo/wallets
 * Returns demo wallet information if demo mode is enabled
 */
demoRouter.get('/wallets', (req, res) => {
  if (!config.enableDemoMode) {
    return res.status(403).json({
      error: 'Demo mode is disabled',
    });
  }

  // Only return whether demo wallets are available, not the actual NWC URLs
  // NWC URLs should be kept secret and only loaded from environment on frontend
  res.json({
    demoMode: true,
    wallets: {
      alice: {
        available: !!config.demoWallets.alice,
        name: 'Alice',
      },
      bob: {
        available: !!config.demoWallets.bob,
        name: 'Bob',
      },
    },
    faucetUrl: 'https://faucet.nwc.dev',
    instructions: 'Demo wallets are pre-configured testing wallets from faucet.nwc.dev.',
  });
});

/**
 * GET /api/demo/status
 * Check if demo mode is available
 */
demoRouter.get('/status', (req, res) => {
  res.json({
    demoMode: config.enableDemoMode,
    network: 'testnet',
  });
});
```

---

## Future Endpoints (Not Implemented Yet)

These endpoints could be added if server-side NWC handling becomes necessary:

```typescript
// POST /api/wallet/connect - Server-side NWC connection
// POST /api/wallet/invoice - Create invoice via server
// POST /api/wallet/pay - Pay invoice via server
// GET /api/wallet/balance - Get balance via server
// GET /api/wallet/transactions - List transactions via server
```

For the current demo, all NWC operations are handled client-side.

---

## File Structure

```
server/
├── index.ts              # Server entry point
├── config.ts             # Configuration
└── routes/
    └── demo.ts           # Demo wallet endpoints
```

---

## Environment Variables

```env
# Server
PORT=3741
NODE_ENV=development
CORS_ORIGINS=http://localhost:5741

# Demo Mode
ENABLE_DEMO_MODE=true
ALICE_NWC_URL=nostr+walletconnect://...
BOB_NWC_URL=nostr+walletconnect://...
```

---

## Test Requirements (TDD)

**File**: `tests/unit/server/demo.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { demoRouter } from '@/server/routes/demo';

// Mock config
vi.mock('@/server/config', () => ({
  config: {
    enableDemoMode: true,
    demoWallets: {
      alice: 'nostr+walletconnect://alice...',
      bob: 'nostr+walletconnect://bob...',
    },
  },
}));

const app = express();
app.use('/api/demo', demoRouter);

describe('Demo API', () => {
  describe('GET /api/demo/wallets', () => {
    it('returns wallet availability when demo mode is enabled', async () => {
      const res = await request(app).get('/api/demo/wallets');

      expect(res.status).toBe(200);
      expect(res.body.demoMode).toBe(true);
      expect(res.body.wallets.alice.available).toBe(true);
      expect(res.body.wallets.bob.available).toBe(true);
    });

    it('does not expose NWC URLs', async () => {
      const res = await request(app).get('/api/demo/wallets');

      expect(res.body.wallets.alice.nwcUrl).toBeUndefined();
      expect(res.body.wallets.bob.nwcUrl).toBeUndefined();
    });
  });

  describe('GET /api/demo/status', () => {
    it('returns demo mode status', async () => {
      const res = await request(app).get('/api/demo/status');

      expect(res.status).toBe(200);
      expect(res.body.demoMode).toBe(true);
      expect(res.body.network).toBe('testnet');
    });
  });
});

describe('Health Check', () => {
  it('returns healthy status', async () => {
    const healthApp = express();
    healthApp.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
    });

    const res = await request(healthApp).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
```

---

## Acceptance Criteria

- [ ] Server starts on configured port
- [ ] Health check endpoint works
- [ ] CORS is configured correctly
- [ ] Demo wallet endpoint returns availability
- [ ] NWC URLs are not exposed via API
- [ ] Error handling works correctly
- [ ] All tests pass

## Security Considerations

1. **Never expose NWC URLs via API** - They should be loaded from environment variables on the frontend
2. **Validate all inputs** - Even for demo endpoints
3. **Use CORS appropriately** - Restrict to known origins
4. **Rate limiting** - Consider adding for production
5. **HTTPS only** - In production, enforce HTTPS

## Related Specifications

- [01-project-setup.md](./01-project-setup.md) - Project configuration
- [05-wallet-context.md](./05-wallet-context.md) - Client-side NWC handling
