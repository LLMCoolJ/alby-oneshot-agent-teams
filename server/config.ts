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
