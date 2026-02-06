# Specification 00: Project Overview

## Purpose

This specification defines the architecture and structure for a Lightning Wallet Demo application demonstrating Bitcoin Lightning Network capabilities using the Alby SDK. The application presents 8 "Alice & Bob" payment scenarios through an interactive interface.

## Dependencies

- None (root specification)

## Development Workflow

Before implementing any Lightning-related features (scenarios, hooks, SDK integration), invoke the **Alby Agent Skill**:

```
/alby-agent-skill
```

This skill provides authoritative documentation for NWC (NIP-47), LNURL, `@getalby/sdk` usage, payment operations, HOLD invoices, BOLT-11 parsing, and fiat conversion. See `CLAUDE.md` for full details.

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | ^18.3 |
| Language | TypeScript | ^5.6 |
| Build Tool | Vite | ^6.0 |
| Styling | Tailwind CSS | ^3.4 |
| Backend | Express.js | ^4.21 |
| Lightning SDK | @getalby/sdk | ^7.0.0 |
| Lightning Tools | @getalby/lightning-tools | ^6.1.0 |
| Testing | Vitest | ^2.1 |
| Testing Library | @testing-library/react | ^16.0 |
| E2E Testing | Playwright | ^1.48 |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              React App                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │    Sidebar      │    │              Scenario Page                   │ │
│  │                 │    │  ┌─────────────────┐ ┌─────────────────────┐│ │
│  │  ○ Scenario 1   │    │  │  Alice Wallet   │ │    Bob Wallet       ││ │
│  │  ○ Scenario 2   │    │  │  ┌───────────┐  │ │  ┌───────────────┐  ││ │
│  │  ○ Scenario 3   │    │  │  │ Balance   │  │ │  │ Balance       │  ││ │
│  │  ○ Scenario 4   │    │  │  │ Actions   │  │ │  │ Actions       │  ││ │
│  │  ○ Scenario 5   │    │  │  └───────────┘  │ │  └───────────────┘  ││ │
│  │  ○ Scenario 6   │    │  └─────────────────┘ └─────────────────────┘│ │
│  │  ○ Scenario 7   │    │                                              │ │
│  │  ○ Scenario 8   │    │  ┌──────────────────────────────────────────┐│ │
│  │                 │    │  │         Transaction Log / Status         ││ │
│  └─────────────────┘    │  └──────────────────────────────────────────┘│ │
│                         └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         WalletContext (React Context)                    │
│  ┌────────────────────────┐        ┌────────────────────────────────┐  │
│  │   Alice NWCClient      │        │      Bob NWCClient             │  │
│  │   - connection state   │        │      - connection state        │  │
│  │   - balance           │        │      - balance                 │  │
│  │   - actions           │        │      - actions                 │  │
│  └────────────────────────┘        └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NWC Protocol (Nostr Wallet Connect)                   │
│                         via @getalby/sdk                                 │
│                                                                          │
│  WebSocket connections to Nostr relays for wallet communication          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────┐     NWC URL      ┌──────────────┐     Nostr      ┌──────────┐
│  User    │ ───────────────► │  NWCClient   │ ◄────────────► │  Wallet  │
│  Input   │                  │  (@getalby)  │    Protocol    │  (Hub)   │
└──────────┘                  └──────────────┘                └──────────┘
     │                              │
     │                              ▼
     │                        ┌──────────────┐
     │                        │   React      │
     │                        │   State      │
     │                        └──────────────┘
     │                              │
     ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                           UI Components                           │
│   WalletCard │ TransactionLog │ ActionPanel │ QRCode │ etc.      │
└──────────────────────────────────────────────────────────────────┘
```

## File Structure

```
├── server/
│   ├── index.ts              # Express server entry
│   ├── config.ts             # Server configuration
│   └── routes/
│       └── demo.ts           # Demo wallet endpoints
│
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component with routing
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx   # Navigation sidebar
│   │   │   ├── Layout.tsx    # Main layout wrapper
│   │   │   └── ScenarioPage.tsx # Reusable page template
│   │   │
│   │   ├── wallet/
│   │   │   ├── WalletCard.tsx    # Wallet display component
│   │   │   ├── WalletConnect.tsx # NWC connection form
│   │   │   └── BalanceDisplay.tsx # Balance with fiat
│   │   │
│   │   ├── transaction/
│   │   │   └── TransactionLog.tsx  # Event log component
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx    # Reusable button
│   │       ├── Input.tsx     # Reusable input
│   │       ├── Card.tsx      # Card container
│   │       ├── Badge.tsx     # Status badges
│   │       ├── Spinner.tsx   # Loading spinner
│   │       ├── QRCode.tsx    # QR code display
│   │       └── CopyButton.tsx # Copy to clipboard
│   │
│   ├── pages/
│   │   ├── 1-SimplePayment.tsx
│   │   ├── 2-LightningAddress.tsx
│   │   ├── 3-Notifications.tsx
│   │   ├── 4-HoldInvoice.tsx
│   │   ├── 5-ProofOfPayment.tsx
│   │   ├── 6-TransactionHistory.tsx
│   │   ├── 7-NostrZap.tsx
│   │   └── 8-FiatConversion.tsx
│   │
│   ├── hooks/
│   │   ├── useWallet.ts      # Wallet state access
│   │   ├── useWalletActions.ts # Wallet actions (connect/disconnect)
│   │   ├── useNWCClient.ts   # NWC client access
│   │   ├── useBalance.ts     # Balance with polling
│   │   ├── useInvoice.ts     # Invoice creation
│   │   ├── usePayment.ts     # Payment execution
│   │   ├── useFiatRate.ts    # Fiat conversion
│   │   ├── useNotifications.ts # Payment notifications
│   │   └── useTransactionLog.ts # Log entry management
│   │
│   ├── context/
│   │   └── WalletContext.tsx # Dual wallet state
│   │
│   ├── lib/
│   │   ├── lightning.ts      # Lightning helper functions
│   │   ├── crypto.ts         # Crypto utilities (hash, etc.)
│   │   └── format.ts         # Formatting utilities
│   │
│   └── types/
│       └── index.ts          # Shared TypeScript types
│
├── tests/
│   ├── setup.ts              # Test setup
│   ├── mocks/                # Mock implementations
│   ├── unit/                 # Unit tests (Vitest)
│   ├── integration/          # Integration tests
│   └── e2e/                  # E2E tests (Playwright)
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── playwright.config.ts
└── .env.example
```

## The 8 Scenarios

| # | Name | Description | Complexity |
|---|------|-------------|------------|
| 1 | Simple Invoice Payment | Bob creates invoice, Alice pays | Low |
| 2 | Lightning Address Payment | Alice pays Bob's Lightning Address | Low |
| 3 | Real-time Notifications | Bob sees incoming payments live | Medium |
| 4 | Hold Invoice (Escrow) | Conditional payment with settle/cancel | High |
| 5 | Proof of Payment | Verify payment with preimage | Medium |
| 6 | Transaction History | List and filter transactions | Medium |
| 7 | Nostr Zap | Social tipping with Nostr | High |
| 8 | Fiat Conversion | Dual sats/fiat display | Low |

## Implementation Order

The specifications are ordered to build upon each other:

1. **Foundation (specs 01-05)**: Project setup, types, shared components, context, layout
2. **Core Scenarios (specs 06-08)**: Simple payment, Lightning address, notifications
3. **Advanced Scenarios (specs 09-12)**: Hold invoice, proof of payment, history, zap
4. **Enhancement (spec 13)**: Fiat conversion (cross-cutting)
5. **Infrastructure (specs 14-15)**: Backend, testing strategy

## Environment Configuration

```env
# Server
PORT=3741
VITE_API_URL=http://localhost:3741

# Demo Wallets (optional - for demo mode)
VITE_ALICE_NWC_URL=nostr+walletconnect://...
VITE_BOB_NWC_URL=nostr+walletconnect://...

# Defaults
VITE_DEFAULT_NETWORK=testnet
```

## Key Design Decisions

### 1. Dual Wallet Architecture
Both Alice and Bob wallets exist simultaneously in the application state, allowing interactive demonstrations of two-party payment scenarios.

### 2. NWC-First Approach
All wallet operations use NWC (Nostr Wallet Connect) via `@getalby/sdk`, ensuring compatibility with any NWC-enabled wallet.

### 3. Units Convention
- **Internal**: All amounts stored/transmitted in millisats (SDK standard)
- **Display**: Always show satoshis to users (rounded)
- **Fiat**: Optional dual display with real-time conversion

### 4. Testnet Only
The application is designed for testnet (faucet.nwc.dev testing wallets) to allow safe experimentation without real funds.

### 5. Component-Driven Design
UI built with reusable, tested components that can be composed for each scenario.

## Success Criteria

- [ ] All 8 scenarios fully functional on testnet
- [ ] Clear visual feedback for all wallet operations
- [ ] Real-time updates when payments are sent/received
- [ ] Works with any NWC-compatible wallet
- [ ] Mobile-responsive design
- [ ] Comprehensive test coverage (unit, integration, E2E)
- [ ] Clear error messages and recovery paths
- [ ] Accessible UI (WCAG 2.1 AA)

## Related Specifications

- [01-project-setup.md](./01-project-setup.md) - Project initialization
- [03-shared-types.md](./03-shared-types.md) - TypeScript definitions
- [16-testing-strategy.md](./16-testing-strategy.md) - Testing approach
