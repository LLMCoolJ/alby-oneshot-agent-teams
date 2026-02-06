# Project Context for Spec Implementation

## Project
- Name: lightning-wallet-demo
- Directory: /home/j0rd/src/alby-oneshot-v6
- Description: A React application demonstrating Bitcoin Lightning Network capabilities using the Alby SDK. Presents 8 "Alice & Bob" payment scenarios through an interactive sidebar navigation.

## Tech Stack

### Frontend
- React ^18.3.1
- React DOM ^18.3.1
- React Router DOM ^7.0.2
- TypeScript ^5.6.3
- Vite ^6.0.1
- Tailwind CSS ^3.4.15
- PostCSS ^8.4.49
- Autoprefixer ^10.4.20

### Lightning
- @getalby/sdk ^7.0.0
- @getalby/lightning-tools ^6.1.0

### UI
- qrcode.react ^4.1.0

### Backend
- Express ^4.21.1
- CORS ^2.8.5

### Testing
- Vitest ^2.1.5
- @testing-library/react ^16.0.1
- @testing-library/jest-dom ^6.6.3
- @testing-library/user-event ^14.5.2
- @playwright/test ^1.48.2
- jsdom ^25.0.1

### Dev Tools
- @vitejs/plugin-react ^4.3.3
- tsx ^4.19.2
- concurrently ^9.1.0

## Project-Specific Skills

| Spec Pattern | Skill | Purpose |
|--------------|-------|---------|
| Any spec using @getalby/sdk, NWC, LNURL, Lightning payments | `/alby-agent-skill` | Authoritative docs for NWC (NIP-47), LNURL, payment operations, HOLD invoices, BOLT-11 parsing, fiat conversion |

## Reference Files

| Spec | File(s) | Contents |
|------|---------|----------|
| 01-project-setup | `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/index.css`, `src/vite-env.d.ts`, `tests/setup.ts`, `.env.example`, `playwright.config.ts`, `tests/utils/test-wallet.ts` | Project config, entry points, test setup, test wallet utilities |
| 02-process-management | `systemd/lightning-wallet-dev.service`, `systemd/lightning-wallet-test.service`, `scripts/setup-services.js`, `scripts/cleanup-processes.js`, `scripts/health-check.js`, `scripts/diagnose.js` | Systemd user services, process management scripts |
| 03-shared-types | `src/types/index.ts` | WalletId, ConnectionStatus, WalletState, Transaction, CreateInvoiceRequest, DecodedInvoice, HoldInvoice, PaymentResult, NotificationEvent, FiatCurrency, NostrEvent, ZapRequest, LogEntry, WalletContextState, AsyncState, Result, CONSTANTS, SCENARIOS, type guards (isSettledTransaction, isConnectedWallet, isValidNwcUrl, isLightningAddress), SDK re-exports (Nip47* types, error classes) |
| 04-shared-components | `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Spinner.tsx`, `src/components/ui/QRCode.tsx`, `src/components/ui/CopyButton.tsx`, `src/components/ui/index.ts` | Button, Input, Card, Badge, Spinner, QRCode, CopyButton with typed props |
| 05-wallet-context | `src/context/WalletContext.tsx`, `src/hooks/useWallet.ts`, `src/hooks/useWalletActions.ts`, `src/hooks/useNWCClient.ts`, `src/hooks/useBalance.ts`, `src/hooks/useInvoice.ts`, `src/hooks/usePayment.ts`, `src/hooks/useBudget.ts`, `src/hooks/useFiatRate.ts`, `src/hooks/index.ts`, `src/components/wallet/WalletCard.tsx`, `src/components/wallet/WalletConnect.tsx`, `src/components/wallet/BalanceDisplay.tsx` | WalletProvider context, all wallet hooks, wallet UI components |
| 06-layout | `src/App.tsx`, `src/components/layout/Layout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/ScenarioPage.tsx`, `src/components/transaction/TransactionLog.tsx`, `src/hooks/useTransactionLog.ts` | App shell, routing, sidebar, scenario page template, transaction log |
| 15-backend | `server/index.ts`, `server/config.ts`, `server/routes/demo.ts` | Express server, config, demo wallet routes |
| 16-testing-strategy | `tests/setup.ts`, `tests/mocks/crypto.ts`, `tests/mocks/nwc.ts`, `tests/mocks/lightning-tools.ts`, `.github/workflows/test.yml` | Test setup, mock factories, CI pipeline |

## Scenario Routes

| Spec | Route | Page Directory |
|------|-------|----------------|
| 07-scenario-1-simple-payment | `/scenarios/1-simple-payment` | `src/pages/1-SimplePayment/` |
| 08-scenario-2-lightning-address | `/scenarios/2-lightning-address` | `src/pages/2-LightningAddress/` |
| 09-scenario-3-notifications | `/scenario/3-notifications` | `src/pages/3-Notifications/` |
| 10-scenario-4-hold-invoice | `/scenarios/4-hold-invoice` | `src/pages/4-HoldInvoice/` |
| 11-scenario-5-proof-of-payment | `/scenarios/5-proof-of-payment` | `src/pages/5-ProofOfPayment/` |
| 12-scenario-6-transaction-history | `/scenario/6-transaction-history` | `src/pages/6-TransactionHistory/` |
| 13-scenario-7-nostr-zap | `/scenario/7-nostr-zap` | `src/pages/7-NostrZap/` |
| 14-scenario-8-fiat-conversion | `/scenarios/8-fiat-conversion` | `src/pages/8-FiatConversion/` |

## Available by Spec

| Spec | Import From | Provides |
|------|-------------|----------|
| 00 | — | Documentation only (architecture reference) |
| 01 | — | Config files, entry points (no code exports) |
| 02 | — | Systemd services, process management scripts (no code exports) |
| 03 | `@/types` | Types, constants, type guards, SDK re-exports |
| 04 | `@/components/ui` | UI primitives (Button, Input, Card, Badge, Spinner, QRCode, CopyButton) |
| 05 | `@/context/WalletContext`, `@/hooks/*`, `@/components/wallet/*` | WalletProvider, wallet hooks (useWallet, useWalletActions, useNWCClient, useBalance, useInvoice, usePayment, useBudget, useFiatRate), wallet components (WalletCard, WalletConnect, BalanceDisplay) |
| 06 | `@/components/layout/*`, `@/components/transaction/*`, `@/hooks/useTransactionLog` | Layout, Sidebar, ScenarioPage, TransactionLog, useTransactionLog |
| 07 | `@/pages/1-SimplePayment` | Simple Payment scenario page and sub-components |
| 08 | `@/hooks/useLightningAddressPayment` | Lightning Address payment hook, scenario page |
| 09 | `@/hooks/useNotifications` | Notifications hook, scenario page |
| 10 | `@/hooks/useHoldInvoice`, `@/lib/crypto` | Hold invoice hook, crypto utilities (generatePreimageAndHash, verifyPreimage) |
| 11 | — | Proof of Payment scenario page (no shared exports) |
| 12 | `@/hooks/useTransactions` | Transaction list hook, scenario page |
| 13 | `@/hooks/useZap` | Zap hook, scenario page |
| 14 | — | Fiat Conversion scenario page (no shared exports) |
| 15 | — | Express backend server (no frontend exports) |
| 16 | `tests/mocks/nwc` (createMockNWCClient) | Testing infrastructure, mock factories, CI config |

*For complete export lists, read the referenced spec file.*

## Import Availability Rule

Specs are implemented in numerical order. When implementing spec N:
- **You may import from** specs where number < N
- **You may NOT import from** specs where number >= N (they don't exist yet)
- **For spec 01**: No imports available - this is the foundation spec

Example: Implementing spec 06 means you can use imports from specs 02, 03, 04, 05.

## Coding Standards

1. Use `@/` path alias for all src imports (maps to `src/*` via tsconfig paths)
2. All monetary amounts annotated with unit comments (`// millisats`, `// sats`, `// seconds`)
3. Unit convention: NWC Client uses millisats, Lightning Tools uses sats, WebLN uses sats
4. Conversion: `toSats(millisats)`, `toMillisats(sats)` with `Math.floor`; use `CONSTANTS.MILLISATS_PER_SAT`
5. JSDoc comments on all exported types and interfaces
6. Type guards for runtime narrowing (`isSettledTransaction`, `isConnectedWallet`, etc.)
7. Constants object frozen with `as const`
8. Re-export SDK types from `@/types` rather than importing directly from SDK
9. `Result<T, E>` union type pattern for fallible operations
10. `AsyncState<T>` pattern: `{ data: T | null; loading: boolean; error: string | null }`
11. `FieldState<T>` pattern for form fields with validation
12. Error handling: `err instanceof Error ? err.message : 'Fallback message'`
13. All components must meet WCAG 2.1 AA standards
14. Keyboard navigation: all interactive elements focusable via Tab
15. Visible focus ring on all interactive elements; color contrast minimum 4.5:1
16. Screen readers: appropriate ARIA labels and roles
17. `forwardRef` for Input component
18. Button variants: primary (`bg-bitcoin`), secondary (`bg-slate-200`), danger (`bg-red-600`), ghost (transparent)
19. Button sizes: sm, md, lg with corresponding Tailwind classes
20. Badge variants: success, warning, error, info, default
21. Card styling: `bg-white`, `border border-slate-200`, `shadow-sm`, `rounded-xl`
22. Use `useReducer` for complex state management in context providers
23. Store non-serializable objects (NWCClient) in `useRef`, not `useState`
24. Custom hooks must throw Error when used outside their Provider
25. Wrap wallet-scoped actions so consumers pass `walletId` once via hook parameter
26. Use `useCallback` for all context-provided functions
27. Polling via `useEffect` + `setInterval` with cleanup return
28. Lazy load scenario pages using `React.lazy()` with `Suspense` and `Spinner` fallback
29. Scenario pages use numbered prefix directories: `src/pages/N-ScenarioName/`
30. Page components use default export; sub-components go in `components/` subdirectory with named exports
31. Form components accept `onLog` callback: `(message: string, type?: 'info' | 'success' | 'error') => void`
32. State managed at page level, passed down as props to child components
33. `useWallet` hook called with wallet name string: `useWallet('alice')`
34. Wallet connection check: `wallet.status === 'connected'`
35. Error display pattern: `{error && <p className="text-sm text-red-600">{error}</p>}`
36. Add `data-testid` attributes to interactive elements (buttons, inputs, forms, key display elements)
37. Notification events converted from SDK types to internal types
38. `useRef` for storing unsubscribe functions to avoid stale closures
39. Cleanup subscriptions on unmount via `useEffect` return
40. Keep bounded lists with `.slice(0, 50)` to prevent unbounded growth
41. `crypto.randomUUID()` for generating unique IDs
42. Canonical ports: backend=3741 (Express), frontend=5741 (Vite)
43. Graceful shutdown: register SIGTERM/SIGINT handlers, force after 10s timeout

## Test Commands

```bash
npm run typecheck    # tsc --noEmit
npm test             # vitest (unit tests)
npm run test:e2e     # playwright test (E2E tests)
```

## Test Structure

- Unit tests: `tests/unit/**/*.test.{ts,tsx}`
- E2E tests: `tests/e2e/**/*.spec.ts`
- Integration tests: `tests/integration/**/*.test.{ts,tsx}`
- Screenshots: `tests/e2e/screenshots/`
- Mocks: `tests/mocks/`
- Mock files: `crypto.ts`, `nwc.ts`, `lightning-tools.ts`
- Test utilities: `tests/utils/test-wallet.ts`
- Coverage thresholds: statements 80%, branches 75%, functions 80%, lines 80%

## Mock Patterns

### NWC Client Mock (tests/mocks/nwc.ts)

```typescript
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
  listTransactions: vi.fn().mockResolvedValue({ transactions: [] }),
  subscribeNotifications: vi.fn().mockResolvedValue(() => {}),
  close: vi.fn(),
  ...overrides,
});
```

### NWC Module Mock

```typescript
vi.mock('@getalby/sdk/nwc', () => ({
  NWCClient: vi.fn().mockImplementation(() => createMockNWCClient()),
}));
```

### Lightning Tools Mocks

```typescript
// LNURL
vi.mock('@getalby/lightning-tools/lnurl', () => ({
  LightningAddress: vi.fn().mockImplementation((address) => ({
    address,
    fetch: vi.fn().mockResolvedValue(undefined),
    lnurlpData: { min: 1, max: 1000000, description: 'Test', commentAllowed: 255, fixed: false },
    requestInvoice: vi.fn().mockResolvedValue({ paymentRequest: 'lnbc1000n1...' }),
    zapInvoice: vi.fn().mockResolvedValue({ paymentRequest: 'lnbc...' }),
  })),
  generateZapEvent: vi.fn(),
}));

// BOLT-11
vi.mock('@getalby/lightning-tools/bolt11', () => ({
  Invoice: vi.fn().mockImplementation(({ pr }) => ({
    paymentHash: 'abc123def456',
    validatePreimage: vi.fn().mockReturnValue(true),
  })),
  decodeInvoice: vi.fn().mockImplementation((invoice) => ({
    paymentHash: 'abc123',
    amount: 1000,
    description: 'Test',
  })),
  fromHexString: vi.fn(),
}));

// Fiat
vi.mock('@getalby/lightning-tools/fiat', () => ({
  getFiatValue: vi.fn().mockResolvedValue(42),
  getSatoshiValue: vi.fn().mockResolvedValue(1000),
  getFormattedFiatValue: vi.fn().mockResolvedValue('$0.42'),
  getFiatBtcRate: vi.fn().mockResolvedValue(42000),
  getFiatCurrencies: vi.fn(),
}));
```

### Hook Mocks

```typescript
// useWallet
vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn().mockReturnValue({
    status: 'connected',
    balance: 100_000_000,
    error: null,
  }),
}));

// useWalletActions
vi.mock('@/hooks/useWalletActions', () => ({
  useWalletActions: vi.fn().mockReturnValue({
    refreshBalance: vi.fn().mockResolvedValue(undefined),
  }),
}));

// useNWCClient
vi.mock('@/hooks/useNWCClient', () => ({
  useNWCClient: vi.fn().mockReturnValue({
    payInvoice: vi.fn().mockResolvedValue({ preimage: 'preimage123', fees_paid: 0 }),
  }),
}));
```

### Test Wallet Provider Wrapper

```typescript
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider>{children}</WalletProvider>
);
```

### Browser/Environment Mocks (tests/setup.ts)

```typescript
// crypto.subtle
vi.stubGlobal('crypto', {
  getRandomValues: (array: Uint8Array) => { /* fill with random */ return array; },
  subtle: { digest: vi.fn().mockImplementation(async () => new Uint8Array(32).buffer) },
  randomUUID: () => 'test-uuid',
});

// WebSocket
vi.stubGlobal('WebSocket', vi.fn().mockImplementation(() => ({
  send: vi.fn(), close: vi.fn(),
  addEventListener: vi.fn(), removeEventListener: vi.fn(),
})));
```

## Response Format

Sub-agents must return JSON only - no prose, no explanations.
Include only: status, summary, file paths, counts, pass/fail booleans.
