import { vi } from 'vitest';

export const createMockNWCClient = (overrides = {}) => ({
  getInfo: vi.fn().mockResolvedValue({
    alias: 'Test Wallet',
    color: '#ff0000',
    pubkey: 'abc123',
    network: 'testnet',
    block_height: 12345,
    methods: ['pay_invoice', 'make_invoice'],
  }),
  getBalance: vi.fn().mockResolvedValue({ balance: 100_000_000 }),
  makeInvoice: vi.fn().mockResolvedValue({ invoice: 'lnbc...' }),
  payInvoice: vi.fn().mockResolvedValue({ preimage: 'preimage123', fees_paid: 0 }),
  getBudget: vi.fn().mockResolvedValue({
    total_budget: 1000000,
    used_budget: 500000,
    renews_at: 1700000000,
    renewal_period: 'monthly',
  }),
  close: vi.fn(),
  ...overrides,
});
