# Specification 16: Testing Strategy

## Purpose

Define the test-driven development (TDD) approach for the Lightning Wallet Demo, including testing patterns, mocking strategies, and test organization.

## Dependencies

- [01-project-setup.md](./01-project-setup.md) - Test framework configuration

## Testing Philosophy

### Test-Driven Development (TDD) Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TDD Cycle                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ┌─────────────┐                                      │
│                    │   1. RED    │                                      │
│                    │ Write test  │                                      │
│                    │ that fails  │                                      │
│                    └──────┬──────┘                                      │
│                           │                                              │
│            ┌──────────────┴──────────────┐                              │
│            ▼                             │                              │
│     ┌─────────────┐               ┌──────┴──────┐                       │
│     │  3. REFACTOR│               │  2. GREEN   │                       │
│     │  Clean up   │◄──────────────│ Write code  │                       │
│     │  the code   │               │ to pass test│                       │
│     └─────────────┘               └─────────────┘                       │
│                                                                          │
│  For each feature/component:                                             │
│  1. Write failing test first                                            │
│  2. Write minimum code to pass                                          │
│  3. Refactor while keeping tests green                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Test Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  ← Few, slow, high confidence
                    │  (Playwright)│
                    └─────────────┘
                   ┌───────────────┐
                   │  Integration  │  ← More, medium speed
                   │   (Vitest)    │
                   └───────────────┘
                  ┌─────────────────┐
                  │     Unit        │  ← Many, fast, focused
                  │    (Vitest)     │
                  └─────────────────┘
```

---

## Test Categories

### 1. Unit Tests

**Location**: `tests/unit/`

Test individual functions, hooks, and components in isolation.

```typescript
// Example: Testing a utility function
describe('toHexString', () => {
  it('converts bytes to hex', () => {
    const bytes = new Uint8Array([0, 15, 255]);
    expect(toHexString(bytes)).toBe('000fff');
  });
});

// Example: Testing a hook
describe('useBalance', () => {
  it('returns null when wallet is disconnected', () => {
    const { result } = renderHook(() => useBalance('alice'));
    expect(result.current.sats).toBeNull();
  });
});

// Example: Testing a component
describe('Button', () => {
  it('shows spinner when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

**Location**: `tests/integration/`

Test multiple components/hooks working together.

```typescript
// Example: Testing a payment flow
describe('Simple Payment Flow', () => {
  it('creates invoice and displays QR code', async () => {
    render(
      <WalletProvider>
        <SimplePaymentPage />
      </WalletProvider>
    );

    // Connect wallets (mocked)
    await connectWallet('bob');

    // Create invoice
    await userEvent.type(screen.getByLabelText(/amount/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create invoice/i }));

    // Verify QR code appears
    await waitFor(() => {
      expect(screen.getByText(/scan to pay/i)).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Tests

**Location**: `tests/e2e/`

Test complete user flows in a real browser using test wallet faucet (see [01-project-setup.md](./01-project-setup.md#test-wallet-faucet)).

```typescript
// tests/e2e/simple-payment.spec.ts
import { test, expect } from '@playwright/test';
import { createTestWalletPair } from '../utils/test-wallet';

test.describe('Simple Payment Flow', () => {
  test('Alice pays Bob via BOLT-11 invoice', async ({ page }) => {
    // Create fresh wallets for this test
    const { alice, bob } = await createTestWalletPair({
      aliceBalance: 10000,
      bobBalance: 1000,
    });

    await page.goto('/simple-payment');

    // Connect Alice's wallet
    await page.fill('[data-testid="alice-nwc-input"]', alice.nwcUrl);
    await page.click('[data-testid="alice-connect"]');
    await expect(page.locator('[data-testid="alice-status"]')).toContainText('Connected');

    // Connect Bob's wallet
    await page.fill('[data-testid="bob-nwc-input"]', bob.nwcUrl);
    await page.click('[data-testid="bob-connect"]');
    await expect(page.locator('[data-testid="bob-status"]')).toContainText('Connected');

    // Bob creates invoice for 100 sats
    await page.fill('[data-testid="invoice-amount"]', '100');
    await page.fill('[data-testid="invoice-description"]', 'E2E test payment');
    await page.click('[data-testid="create-invoice"]');

    // Wait for invoice to appear
    await expect(page.locator('[data-testid="invoice-qr"]')).toBeVisible();
    const invoice = await page.locator('[data-testid="invoice-bolt11"]').textContent();
    expect(invoice).toMatch(/^lnbc/);

    // Alice pays the invoice
    await page.fill('[data-testid="pay-invoice-input"]', invoice!);
    await page.click('[data-testid="pay-invoice-button"]');

    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="payment-preimage"]')).toBeVisible();
  });

  test('Payment fails with insufficient balance', async ({ page }) => {
    const { alice, bob } = await createTestWalletPair({
      aliceBalance: 50, // Only 50 sats
      bobBalance: 1000,
    });

    await page.goto('/simple-payment');

    // Connect both wallets
    await page.fill('[data-testid="alice-nwc-input"]', alice.nwcUrl);
    await page.click('[data-testid="alice-connect"]');
    await page.fill('[data-testid="bob-nwc-input"]', bob.nwcUrl);
    await page.click('[data-testid="bob-connect"]');

    // Bob creates invoice for 1000 sats (more than Alice has)
    await page.fill('[data-testid="invoice-amount"]', '1000');
    await page.click('[data-testid="create-invoice"]');

    const invoice = await page.locator('[data-testid="invoice-bolt11"]').textContent();

    // Alice attempts to pay
    await page.fill('[data-testid="pay-invoice-input"]', invoice!);
    await page.click('[data-testid="pay-invoice-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="payment-error"]')).toContainText(/insufficient/i);
  });
});
```

```typescript
// tests/e2e/lightning-address.spec.ts
import { test, expect } from '@playwright/test';
import { createTestWalletPair } from '../utils/test-wallet';

test('Alice pays Bob\'s lightning address', async ({ page }) => {
  const { alice, bob } = await createTestWalletPair();

  await page.goto('/lightning-address');

  // Connect Alice
  await page.fill('[data-testid="alice-nwc-input"]', alice.nwcUrl);
  await page.click('[data-testid="alice-connect"]');

  // Enter Bob's lightning address and amount
  await page.fill('[data-testid="ln-address-input"]', bob.lightningAddress);
  await page.fill('[data-testid="ln-address-amount"]', '100');

  // Pay
  await page.click('[data-testid="ln-address-pay"]');

  // Verify success
  await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 30000 });
});
```

### 4. Integration Tests with Real Wallets

For faster feedback than E2E but more realistic than mocks:

```typescript
// tests/integration/payment-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NWCClient } from '@getalby/sdk/nwc';
import { createTestWalletPair } from '../utils/test-wallet';

describe('Payment Flow Integration', () => {
  let alice: { nwcUrl: string; lightningAddress: string };
  let bob: { nwcUrl: string; lightningAddress: string };
  let aliceClient: NWCClient;
  let bobClient: NWCClient;

  beforeAll(async () => {
    const wallets = await createTestWalletPair();
    alice = wallets.alice;
    bob = wallets.bob;

    aliceClient = new NWCClient({ nostrWalletConnectUrl: alice.nwcUrl });
    bobClient = new NWCClient({ nostrWalletConnectUrl: bob.nwcUrl });
  }, 30000);

  afterAll(() => {
    aliceClient?.close();
    bobClient?.close();
  });

  it('creates and pays invoice', async () => {
    // Bob creates invoice
    const invoice = await bobClient.makeInvoice({
      amount: 1000, // 1 sat in millisats
      description: 'Integration test',
    });

    expect(invoice.invoice).toMatch(/^lnbc/);

    // Alice pays invoice
    const payment = await aliceClient.payInvoice({
      invoice: invoice.invoice,
    });

    expect(payment.preimage).toBeTruthy();
    expect(payment.preimage).toHaveLength(64);
  }, 30000);

  it('fetches balance', async () => {
    const balance = await aliceClient.getBalance();
    expect(balance.balance).toBeGreaterThan(0);
  });
});
```

---

## Mocking Strategy

### NWC Client Mock

**File**: `tests/mocks/nwc.ts`

```typescript
import { vi } from 'vitest';
import type { NWCClient } from '@getalby/sdk/nwc';

export const createMockNWCClient = (overrides = {}): Partial<NWCClient> => ({
  getInfo: vi.fn().mockResolvedValue({
    alias: 'Test Wallet',
    color: '#ff0000',
    pubkey: 'abc123',
    network: 'testnet',
    block_height: 12345,
    methods: ['pay_invoice', 'make_invoice', 'get_balance'],
    lud16: 'test@getalby.com',
  }),

  getBalance: vi.fn().mockResolvedValue({
    balance: 100_000_000, // 100k sats in millisats
  }),

  makeInvoice: vi.fn().mockResolvedValue({
    invoice: 'lnbc1000n1...',
    payment_hash: 'abc123',
    amount: 1_000_000,
    description: 'Test invoice',
    created_at: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }),

  payInvoice: vi.fn().mockResolvedValue({
    preimage: 'preimage123456789',
    fees_paid: 1000,
  }),

  listTransactions: vi.fn().mockResolvedValue({
    transactions: [],
    total_count: 0,
  }),

  subscribeNotifications: vi.fn().mockResolvedValue(() => {}),

  close: vi.fn(),

  ...overrides,
});

// Mock the NWCClient constructor
vi.mock('@getalby/sdk/nwc', () => ({
  NWCClient: vi.fn().mockImplementation(() => createMockNWCClient()),
}));
```

### Lightning Tools Mock

**File**: `tests/mocks/lightning-tools.ts`

Mock each subpath separately to match actual import patterns:

```typescript
import { vi } from 'vitest';

// Mock LNURL subpath
vi.mock('@getalby/lightning-tools/lnurl', () => ({
  LightningAddress: vi.fn().mockImplementation((address: string) => ({
    address,
    fetch: vi.fn().mockResolvedValue(undefined),
    lnurlpData: {
      min: 1,
      max: 1_000_000,
      description: 'Test address',
      commentAllowed: 255,
      fixed: false,
    },
    requestInvoice: vi.fn().mockResolvedValue({
      paymentRequest: 'lnbc1000n1...',
      paymentHash: 'hash123',
    }),
    zapInvoice: vi.fn().mockResolvedValue({
      paymentRequest: 'lnbc1000n1zap...',
    }),
  })),
  generateZapEvent: vi.fn().mockResolvedValue({
    id: 'event123',
    kind: 9734,
    content: '',
    tags: [],
    created_at: Date.now() / 1000,
  }),
}));

// Mock bolt11 subpath
vi.mock('@getalby/lightning-tools/bolt11', () => ({
  Invoice: vi.fn().mockImplementation(({ pr }) => ({
    paymentRequest: pr,
    paymentHash: 'hash123',
    satoshi: 1000,
    description: 'Test invoice',
    validatePreimage: vi.fn().mockReturnValue(true),
    isPaid: vi.fn().mockResolvedValue(false),
    hasExpired: vi.fn().mockReturnValue(false),
  })),
  decodeInvoice: vi.fn().mockImplementation((invoice: string) => ({
    paymentHash: 'hash123',
    satoshi: 1000,
    timestamp: Date.now() / 1000,
    expiry: 3600,
    description: 'Test invoice',
  })),
  fromHexString: vi.fn().mockImplementation((hex: string) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }),
}));

// Mock fiat subpath
vi.mock('@getalby/lightning-tools/fiat', () => ({
  getFiatValue: vi.fn().mockResolvedValue(42.00),
  getSatoshiValue: vi.fn().mockResolvedValue(1000),
  getFormattedFiatValue: vi.fn().mockResolvedValue('$42.00'),
  getFiatBtcRate: vi.fn().mockResolvedValue(42000),
  getFiatCurrencies: vi.fn().mockResolvedValue([
    { code: 'USD', name: 'US Dollar', symbol: '$', priority: 1 },
    { code: 'EUR', name: 'Euro', symbol: '€', priority: 2 },
  ]),
}));
```

### Crypto Mock

**File**: `tests/mocks/crypto.ts`

```typescript
import { vi } from 'vitest';

// Mock Web Crypto API for Node.js environment
const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: vi.fn().mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
      // Return deterministic hash for testing
      return new Uint8Array(32).fill(0xab).buffer;
    }),
  },
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
};

vi.stubGlobal('crypto', mockCrypto);
```

---

## Test Setup

**File**: `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Import mocks
import './mocks/crypto';
import './mocks/nwc';
import './mocks/lightning-tools';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock WebSocket
beforeAll(() => {
  vi.stubGlobal('WebSocket', vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
  })));
});

// Mock matchMedia for responsive tests
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
```

---

## Test File Organization

```
tests/
├── setup.ts                      # Global test setup
├── mocks/
│   ├── crypto.ts                 # Crypto API mock
│   ├── nwc.ts                    # NWC client mock
│   └── lightning-tools.ts        # Lightning tools mock
│
├── unit/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   ├── Card.test.tsx
│   │   ├── QRCode.test.tsx
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useWallet.test.ts
│   │   ├── useBalance.test.ts
│   │   ├── useInvoice.test.ts
│   │   ├── usePayment.test.ts
│   │   ├── useNotifications.test.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── crypto.test.ts
│   │   └── format.test.ts
│   │
│   ├── context/
│   │   └── WalletContext.test.tsx
│   │
│   └── pages/
│       ├── SimplePayment.test.tsx
│       ├── LightningAddress.test.tsx
│       └── ...
│
├── integration/
│   ├── payment-flow.test.tsx
│   ├── wallet-connection.test.tsx
│   └── notification-flow.test.tsx
│
└── e2e/
    ├── simple-payment.spec.ts
    ├── lightning-address.spec.ts
    └── full-demo.spec.ts
```

---

## Testing Patterns

### Pattern 1: Testing Async Hooks

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';

describe('useInvoice', () => {
  it('creates invoice successfully', async () => {
    const { result } = renderHook(() => useInvoice('bob'), {
      wrapper: WalletProvider,
    });

    await act(async () => {
      await result.current.createInvoice({ amount: 1000000 });
    });

    await waitFor(() => {
      expect(result.current.invoice).not.toBeNull();
    });

    expect(result.current.invoice?.amount).toBe(1000000);
  });
});
```

### Pattern 2: Testing Components with Context

```typescript
import { render, screen } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { BrowserRouter } from 'react-router-dom';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <WalletProvider>
        {ui}
      </WalletProvider>
    </BrowserRouter>
  );
};

describe('WalletCard', () => {
  it('shows connect form when disconnected', () => {
    renderWithProviders(<WalletCard walletId="alice" />);
    expect(screen.getByLabelText(/nwc connection/i)).toBeInTheDocument();
  });
});
```

### Pattern 3: Testing Error States

```typescript
describe('PayInvoiceForm', () => {
  it('shows error when payment fails', async () => {
    // Override mock to simulate failure
    vi.mocked(usePayment).mockReturnValue({
      payInvoice: vi.fn().mockRejectedValue(new Error('Insufficient balance')),
      loading: false,
      error: 'Insufficient balance',
      result: null,
      reset: vi.fn(),
    });

    render(<PayInvoiceForm onPaymentSuccess={() => {}} onLog={() => {}} />);

    await userEvent.type(screen.getByLabelText(/invoice/i), 'lnbc...');
    await userEvent.click(screen.getByRole('button', { name: /pay/i }));

    expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
  });
});
```

### Pattern 4: Testing Real-time Updates

```typescript
describe('NotificationSubscriber', () => {
  it('updates when notification received', async () => {
    const onNotification = vi.fn();

    const { result } = renderHook(() =>
      useNotifications('bob', { onNotification })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    // Simulate receiving a notification
    const mockNotification = {
      notification_type: 'payment_received',
      notification: {
        amount: 1000000,
        payment_hash: 'hash123',
      },
    };

    // Trigger the callback that was passed to subscribeNotifications
    act(() => {
      const subscribeCall = vi.mocked(mockNWCClient.subscribeNotifications).mock.calls[0];
      const callback = subscribeCall[0];
      callback(mockNotification);
    });

    expect(onNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'payment_received',
    }));
  });
});
```

---

## Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

```typescript
// vitest.config.ts coverage settings
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
  thresholds: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
}
```

---

## Continuous Integration

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Unit & Integration tests
        run: npm run test:coverage

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

---

## Acceptance Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Coverage meets thresholds
- [ ] CI pipeline runs successfully
- [ ] Tests are deterministic (no flaky tests)
- [ ] Mocks accurately represent real behavior

## Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e -- --ui
```

## Related Specifications

- [01-project-setup.md](./01-project-setup.md) - Test configuration and test wallet faucet setup
- All scenario specifications - Include test requirements
