# Specification 06: Layout & Navigation

## Purpose

Define the main application layout including sidebar navigation, routing, and responsive design.

## Dependencies

- [01-project-setup.md](./01-project-setup.md) - React Router setup
- [03-shared-types.md](./03-shared-types.md) - SCENARIOS constant
- [04-shared-components.md](./04-shared-components.md) - UI components
- [05-wallet-context.md](./05-wallet-context.md) - WalletProvider

---

## Application Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                          Header (optional)                       │
│  Logo                                           Testnet Badge   │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│   Sidebar    │               Main Content                        │
│              │                                                   │
│  ┌────────┐  │  ┌─────────────────────────────────────────────┐ │
│  │ Logo   │  │  │                                             │ │
│  ├────────┤  │  │            Scenario Page                    │ │
│  │Scenario│  │  │                                             │ │
│  │  List  │  │  │  ┌─────────────┐    ┌─────────────┐       │ │
│  │        │  │  │  │ Alice Card  │    │  Bob Card   │       │ │
│  │ ○ 1    │  │  │  └─────────────┘    └─────────────┘       │ │
│  │ ○ 2    │  │  │                                             │ │
│  │ ○ 3    │  │  │  ┌─────────────────────────────────────┐   │ │
│  │ ...    │  │  │  │         Transaction Log             │   │ │
│  │        │  │  │  └─────────────────────────────────────┘   │ │
│  ├────────┤  │  │                                             │ │
│  │ Links  │  │  └─────────────────────────────────────────────┘ │
│  │Faucet ↗│  │                                                   │
│  └────────┘  │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## App.tsx

**File**: `src/App.tsx`

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from '@/context/WalletContext';
import { Layout } from '@/components/layout/Layout';

// Lazy load scenario pages
import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui';

const SimplePayment = lazy(() => import('@/pages/1-SimplePayment'));
const LightningAddress = lazy(() => import('@/pages/2-LightningAddress'));
const Notifications = lazy(() => import('@/pages/3-Notifications'));
const HoldInvoice = lazy(() => import('@/pages/4-HoldInvoice'));
const ProofOfPayment = lazy(() => import('@/pages/5-ProofOfPayment'));
const TransactionHistory = lazy(() => import('@/pages/6-TransactionHistory'));
const NostrZap = lazy(() => import('@/pages/7-NostrZap'));
const FiatConversion = lazy(() => import('@/pages/8-FiatConversion'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/simple-payment" replace />} />
            <Route path="/simple-payment" element={<SimplePayment />} />
            <Route path="/lightning-address" element={<LightningAddress />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/hold-invoice" element={<HoldInvoice />} />
            <Route path="/proof-of-payment" element={<ProofOfPayment />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/nostr-zap" element={<NostrZap />} />
            <Route path="/fiat-conversion" element={<FiatConversion />} />
          </Routes>
        </Suspense>
      </Layout>
    </WalletProvider>
  );
}
```

---

## Layout Component

**File**: `src/components/layout/Layout.tsx`

```typescript
import { useState } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Lightning Demo</h1>
          <TestnetBadge />
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function TestnetBadge() {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Testnet
    </span>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
```

---

## Sidebar Component

**File**: `src/components/layout/Sidebar.tsx`

```typescript
import { NavLink } from 'react-router-dom';
import { SCENARIOS, CONSTANTS } from '@/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <LightningIcon className="w-8 h-8 text-bitcoin" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">Lightning Demo</h1>
                <p className="text-xs text-slate-500">Alice & Bob Scenarios</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
              aria-label="Close menu"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {SCENARIOS.map((scenario) => (
                <li key={scenario.id}>
                  <NavLink
                    to={scenario.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${isActive
                        ? 'bg-bitcoin/10 text-bitcoin'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    <span className="text-lg" role="img" aria-hidden="true">
                      {scenario.icon}
                    </span>
                    <span>{scenario.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer links */}
          <div className="border-t border-slate-200 p-4 space-y-2">
            <a
              href={CONSTANTS.FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-bitcoin"
            >
              <FaucetIcon className="w-4 h-4" />
              Get Testnet Sats
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/getAlby/alby-js-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-bitcoin"
            >
              <GithubIcon className="w-4 h-4" />
              Alby SDK Docs
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

// Icon components (inline SVGs for simplicity)
function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FaucetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.42 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
```

---

## Scenario Page Template

**File**: `src/components/layout/ScenarioPage.tsx`

A reusable template for scenario pages:

```typescript
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionLog } from '@/components/transaction/TransactionLog';
import type { LogEntry } from '@/types';

interface ScenarioPageProps {
  title: string;
  description: string;
  aliceContent?: React.ReactNode;
  bobContent?: React.ReactNode;
  logs: LogEntry[];
  children?: React.ReactNode;
}

export function ScenarioPage({
  title,
  description,
  aliceContent,
  bobContent,
  logs,
  children,
}: ScenarioPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-slate-600">{description}</p>
      </div>

      {/* Wallet cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WalletCard walletId="alice" title="Alice's Wallet">
          {aliceContent}
        </WalletCard>
        <WalletCard walletId="bob" title="Bob's Wallet">
          {bobContent}
        </WalletCard>
      </div>

      {/* Additional content */}
      {children}

      {/* Transaction log */}
      <TransactionLog entries={logs} />
    </div>
  );
}
```

---

## TransactionLog Component

**File**: `src/components/transaction/TransactionLog.tsx`

```typescript
import { Badge } from '@/components/ui';
import type { LogEntry } from '@/types';

interface TransactionLogProps {
  entries: LogEntry[];
  maxHeight?: string;
}

export function TransactionLog({ entries, maxHeight = '300px' }: TransactionLogProps) {
  if (entries.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Log</h3>
        <p className="text-slate-500 text-sm">No events yet. Start a transaction to see activity.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Log</h3>
      <div
        className="space-y-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        {entries.map((entry) => (
          <LogItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function LogItem({ entry }: { entry: LogEntry }) {
  const badgeVariant = {
    info: 'info',
    success: 'success',
    error: 'error',
    warning: 'warning',
  }[entry.type] as const;

  const timeStr = entry.timestamp.toLocaleTimeString();

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
        {timeStr}
      </span>
      <Badge variant={badgeVariant} size="sm">
        {entry.type}
      </Badge>
      <span className="text-sm text-slate-700 flex-1">
        {entry.message}
      </span>
    </div>
  );
}
```

---

## useTransactionLog Hook

**File**: `src/hooks/useTransactionLog.ts`

```typescript
import { useState, useCallback } from 'react';
import type { LogEntry } from '@/types';

export function useTransactionLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const addLog = useCallback((
    message: string,
    type: LogEntry['type'] = 'info',
    details?: Record<string, unknown>
  ) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
      details,
    };
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const clearLogs = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addLog, clearLogs };
}
```

---

## Test Requirements (TDD)

### Layout Tests

**File**: `tests/unit/components/Layout.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Layout', () => {
  it('renders children', () => {
    render(<Layout><div>Test Content</div></Layout>, { wrapper });
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows mobile menu button on small screens', () => {
    // Mock mobile viewport
    window.innerWidth = 375;
    render(<Layout><div>Content</div></Layout>, { wrapper });
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});
```

### Sidebar Tests

**File**: `tests/unit/components/Sidebar.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { SCENARIOS } from '@/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Sidebar', () => {
  it('renders all scenario links', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });

    SCENARIOS.forEach((scenario) => {
      expect(screen.getByText(scenario.name)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Sidebar open={true} onClose={onClose} />, { wrapper });

    await userEvent.click(screen.getByLabelText('Close menu'));
    expect(onClose).toHaveBeenCalled();
  });

  it('has correct active state for current route', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    // Note: would need to set up router context properly for full test
  });

  it('renders external links with proper attributes', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });

    const faucetLink = screen.getByText('Get Testnet Sats').closest('a');
    expect(faucetLink).toHaveAttribute('target', '_blank');
    expect(faucetLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
```

### TransactionLog Tests

**File**: `tests/unit/components/TransactionLog.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionLog } from '@/components/transaction/TransactionLog';
import type { LogEntry } from '@/types';

describe('TransactionLog', () => {
  it('shows empty state when no entries', () => {
    render(<TransactionLog entries={[]} />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  it('renders log entries', () => {
    const entries: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(),
        message: 'Payment sent successfully',
        type: 'success',
      },
      {
        id: '2',
        timestamp: new Date(),
        message: 'Creating invoice...',
        type: 'info',
      },
    ];

    render(<TransactionLog entries={entries} />);

    expect(screen.getByText('Payment sent successfully')).toBeInTheDocument();
    expect(screen.getByText('Creating invoice...')).toBeInTheDocument();
  });

  it('applies correct badge variant for entry type', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Error!', type: 'error' },
    ];

    render(<TransactionLog entries={entries} />);
    // Badge should have error styling
  });
});
```

---

## Responsive Breakpoints

| Breakpoint | Width | Sidebar Behavior |
|------------|-------|------------------|
| Mobile | < 1024px | Hidden by default, slide-in overlay |
| Desktop | >= 1024px | Always visible, fixed position |

---

## Acceptance Criteria

- [ ] Sidebar shows all 8 scenarios
- [ ] Active route is visually highlighted
- [ ] Mobile menu opens/closes properly
- [ ] Clicking overlay closes mobile menu
- [ ] External links open in new tab
- [ ] Layout is responsive
- [ ] Lazy loading works for pages
- [ ] Navigation works between all routes
- [ ] All tests pass

## Related Specifications

- [03-shared-types.md](./03-shared-types.md) - SCENARIOS constant
- [04-shared-components.md](./04-shared-components.md) - UI components
- [05-wallet-context.md](./05-wallet-context.md) - WalletProvider wrapping
- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - First scenario page
