import { Router } from 'express';
import { config } from '../config';

export const demoRouter = Router();

/**
 * GET /api/demo/wallets
 * Returns demo wallet information if demo mode is enabled
 */
demoRouter.get('/wallets', (_req, res) => {
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
demoRouter.get('/status', (_req, res) => {
  res.json({
    demoMode: config.enableDemoMode,
    network: 'testnet',
  });
});
