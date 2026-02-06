# PRD: Lightning Wallet Demo - Alice & Bob Scenarios

## Overview

A React application demonstrating Bitcoin Lightning Network capabilities using the Alby SDK. The app presents 8 common "Alice & Bob" payment scenarios through an interactive sidebar navigation, allowing developers to understand and experiment with Lightning payments on testnet.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express.js (for NWC connection handling)
- **Styling:** Tailwind CSS (simple, utility-first)
- **Lightning:** `@getalby/sdk` (NWC Client) + `@getalby/lightning-tools`
- **Network:** Testnet (faucet.nwc.dev testing wallets)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React App                         │
├──────────────┬──────────────────────────────────────┤
│   Sidebar    │         Scenario Page                 │
│              │  ┌─────────────────────────────────┐ │
│  • Scenario 1│  │  Alice's Wallet    Bob's Wallet │ │
│  • Scenario 2│  │  ┌───────────┐    ┌───────────┐ │ │
│  • Scenario 3│  │  │  Balance  │    │  Balance  │ │ │
│  • ...       │  │  │  Actions  │    │  Actions  │ │ │
│              │  │  └───────────┘    └───────────┘ │ │
│              │  │                                 │ │
│              │  │  Transaction Log / Status       │ │
│              │  └─────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

## The 8 Alice & Bob Scenarios

### 1. Simple Invoice Payment
**Story:** Bob creates an invoice, Alice pays it.

**Flow:**
1. Bob enters amount + description → clicks "Create Invoice"
2. Invoice (BOLT-11) displayed as QR code + copyable string
3. Alice pastes invoice → clicks "Pay Invoice"
4. Both wallets update, payment confirmed with preimage

**SDK Methods:**
- `client.makeInvoice({ amount, description })`
- `client.payInvoice({ invoice })`
- `client.getBalance()`

---

### 2. Lightning Address Payment
**Story:** Alice pays Bob using just his Lightning Address (no invoice needed).

**Flow:**
1. Bob displays his Lightning Address (e.g., `bob@testnet.getalby.com`)
2. Alice enters the address + amount
3. System fetches LNURL data, generates invoice, pays automatically
4. Payment confirmed

**SDK Methods:**
- `LightningAddress.fetch()`
- `LightningAddress.requestInvoice({ satoshi })`
- `client.payInvoice({ invoice })`

---

### 3. Real-time Payment Notifications
**Story:** Bob subscribes to notifications and sees incoming payments in real-time.

**Flow:**
1. Bob clicks "Start Listening" → subscribes to notifications
2. Alice sends multiple small payments
3. Bob's UI updates in real-time with each incoming payment
4. Notification log shows payment_received events

**SDK Methods:**
- `client.subscribeNotifications(callback, ['payment_received'])`
- `client.payInvoice({ invoice })`

---

### 4. Hold Invoice (Escrow)
**Story:** Conditional payment - Alice pays, but Bob can't claim until condition is met, or Alice can cancel.

**Flow:**
1. Bob creates a hold invoice with a payment_hash
2. Alice pays the hold invoice (funds locked)
3. Status shows "HELD" - funds in escrow
4. Option A: Bob settles with preimage → receives funds
5. Option B: Bob cancels → Alice gets refund

**SDK Methods:**
- `client.makeHoldInvoice({ amount, payment_hash })`
- `client.payInvoice({ invoice })`
- `client.settleHoldInvoice({ preimage })`
- `client.cancelHoldInvoice({ payment_hash })`

**Use Case:** Escrow, atomic swaps, conditional delivery

---

### 5. Proof of Payment
**Story:** Alice proves to a third party that she paid Bob.

**Flow:**
1. Bob creates invoice
2. Alice pays → receives preimage
3. Alice can verify the preimage matches the payment_hash
4. Visual demo: show hash(preimage) === payment_hash

**SDK Methods:**
- `client.payInvoice({ invoice })` → returns `{ preimage }`
- `Invoice.validatePreimage(preimage)`
- `decodeInvoice(bolt11)` → get payment_hash

---

### 6. Transaction History
**Story:** Both Alice and Bob view their transaction history with filtering.

**Flow:**
1. Display transaction list for each wallet
2. Filter by: incoming/outgoing, date range, status
3. Click transaction → show details (amount, fees, preimage, metadata)

**SDK Methods:**
- `client.listTransactions({ type, limit, from, until })`
- `client.lookupInvoice({ payment_hash })`

---

### 7. Nostr Zap
**Story:** Alice zaps Bob's Nostr note (social tipping).

**Flow:**
1. Bob displays a mock Nostr note with his npub
2. Alice clicks "Zap" → enters amount
3. System creates zap invoice with proper Nostr tags
4. Alice pays, zap receipt created

**SDK Methods:**
- `LightningAddress.zapInvoice({ satoshi, comment, relays, e })`
- `generateZapEvent({ satoshi, comment, p, e, relays })`
- `client.payInvoice({ invoice })`

---

### 8. Fiat Conversion Display
**Story:** Display all amounts in both sats and fiat (USD/EUR).

**Flow:**
1. User selects preferred fiat currency
2. All balances and amounts show dual display: "10,000 sats (~$4.20)"
3. Can input amounts in either sats or fiat
4. Real-time conversion as user types

**SDK Methods:**
- `getFiatValue({ satoshi, currency })`
- `getSatoshiValue({ amount, currency })`
- `getFormattedFiatValue({ satoshi, currency, locale })`
- `getFiatBtcRate(currency)`

---

## UI Components

### Sidebar
- App logo/title
- 8 scenario links with icons
- Active state highlighting
- Collapse on mobile

### Wallet Card
- Wallet name (Alice/Bob)
- Balance display (sats + fiat)
- Connection status indicator
- NWC connection string input (hidden by default)

### Action Panel
- Scenario-specific inputs and buttons
- Clear call-to-action
- Loading states

### Transaction Log
- Scrollable list of events
- Timestamps
- Status badges (pending, settled, failed)
- Expandable details

## Testnet Setup

### Option 1: faucet.nwc.dev Testing Wallets (Recommended)
- Instant testing wallets with a single API request
- No setup required - wallets are pre-funded
- Faucet: https://faucet.nwc.dev

### Option 2: User's Own Testnet Wallet
- Allow users to paste their own NWC connection string
- Provide instructions for setting up Alby Hub on testnet

### Demo Mode
- Pre-configured "Alice" and "Bob" wallets for demos
- Environment variables for NWC strings
- Faucet link to get testnet sats

## Environment Variables

```env
# Server
PORT=3741
VITE_API_URL=http://localhost:3741

# Demo Wallets (optional - for demo mode, VITE_ prefix for client access)
VITE_ALICE_NWC_URL=nostr+walletconnect://...
VITE_BOB_NWC_URL=nostr+walletconnect://...

# Defaults
VITE_DEFAULT_NETWORK=testnet
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

## Implementation Priority

### Phase 1: Foundation
1. Project setup (Vite + React + Express + Tailwind)
2. Sidebar + routing
3. WalletCard component with NWC connection
4. Scenario 1: Simple Invoice Payment (proves the stack works)

### Phase 2: Core Scenarios
5. Scenario 2: Lightning Address Payment
6. Scenario 3: Real-time Notifications

### Phase 3: Advanced Scenarios
7. Scenario 4: Hold Invoice
8. Scenario 5: Proof of Payment
9. Scenario 6: Transaction History
10. Scenario 7: Nostr Zap

### Phase 4: Polish
11. Scenario 8: Fiat Conversion (can be added to all pages)
12. Mobile responsiveness
13. Error handling improvements
14. Demo mode with pre-funded wallets

## Success Criteria

- [ ] All 8 scenarios functional on testnet
- [ ] Clear visual feedback for all operations
- [ ] Both wallets update in real-time
- [ ] Works with any NWC-compatible wallet
- [ ] Mobile-friendly layout
- [ ] Helpful error messages

## Development Tools

### Alby Agent Skill

This project should be developed using the **Alby Agent Skill** (`/alby-agent-skill`) in Claude Code. The skill provides authoritative documentation and implementation guidance for:

- **NWC (NIP-47)** - Nostr Wallet Connect protocol for wallet communication
- **LNURL** - Lightning URL protocol for addresses and payments
- **Payment operations** - Sending, receiving, notifications
- **HOLD invoices** - Conditional settlement and cancellation
- **BOLT-11 parsing** - Invoice decoding and preimage verification
- **Fiat conversion** - Bitcoin to fiat currency rates

Always invoke `/alby-agent-skill` before implementing Lightning-related features to ensure correct SDK usage.

## References

- [Alby SDK Documentation](https://github.com/getAlby/alby-js-sdk)
- [NWC Protocol (NIP-47)](https://github.com/nostr-protocol/nips/blob/master/47.md)
- [Lightning Network Paper](https://lightning.network/lightning-network-paper.pdf)
- [BOLT-11 Invoice Spec](https://github.com/lightning/bolts/blob/master/11-payment-encoding.md)
- [LNURL Spec](https://github.com/lnurl/luds)
- [Testing Wallet Faucet](https://faucet.nwc.dev)

## Research Sources

- [Lightning Network Primer - Lightspark](https://www.lightspark.com/developers/primer)
- [How Payments Route on Lightning - Gemini](https://www.gemini.com/en-GB/blog/how-do-payments-make-their-way-across-the-bitcoin-lightning-network)
- [Understanding Lightning Network - Bitstack](https://www.bitstack-app.com/en/learn-bitcoin/understanding-how-the-lightning-network-works)
