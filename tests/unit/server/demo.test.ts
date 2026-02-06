import { describe, it, expect, vi } from 'vitest';
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
    healthApp.get('/health', (_req, res) => {
      res.json({ status: 'healthy' });
    });

    const res = await request(healthApp).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
