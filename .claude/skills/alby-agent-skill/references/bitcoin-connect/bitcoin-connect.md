# Bitcoin Connect

## How to install

Two packages are available depending on your framework:

**Web Components (React, Vue, Angular, Solid.js, pure HTML):**

Install the npm package `@getalby/bitcoin-connect@3`

**React-specific components:**

Install the npm package `@getalby/bitcoin-connect-react@3`

**CDN (HTML-only, no build step):**

```html
<script src="https://esm.sh/@getalby/bitcoin-connect@3"></script>
```

or

```html
<script type="module">
  import {launchModal} from 'https://esm.sh/@getalby/bitcoin-connect@3';
  //...use it here
</script>
```

## Key concepts

- Web components for connecting Lightning wallets and enabling WebLN
- Works with React, Vue, Angular, Solid.js, and pure HTML
- Desktop and mobile support (no browser extension required)
- Payment UI for accepting payments via QR code or connected wallet
- Supports multiple wallet connectors: Alby Hub, NWC, LNbits, Lightning Node Connect, and more

## Units

Unlike NWC, WebLN operates on sats, not millisats. (1000 millisats = 1 satoshi)

## Initialization

```ts
import { init } from "@getalby/bitcoin-connect";

init({
  appName: "My App",
  // optional:
  // appIcon: "https://example.com/icon.png",
  // showBalance: true,
  // filters: ["nwc"], // only allow NWC wallets
});
```

## Core API

### Launch wallet connection modal

```ts
import { launchModal } from "@getalby/bitcoin-connect";

launchModal();
```

### Launch payment modal

```ts
import { launchPaymentModal } from "@getalby/bitcoin-connect";

const { setPaid } = launchPaymentModal({
  invoice: "lnbc...", // BOLT-11 invoice
  onPaid: (response) => {
    console.log("Payment preimage:", response.preimage);
  },
  onCancelled: () => {
    console.log("Payment cancelled");
  },
});

// For external payments (e.g. QR code scanned by another wallet):
// setPaid({ preimage: "..." });
```

### Request WebLN provider

```ts
import { requestProvider } from "@getalby/bitcoin-connect";

// Returns existing provider or launches modal for user to connect
const provider = await requestProvider();

// Now use WebLN methods
const { preimage } = await provider.sendPayment("lnbc...");
const { paymentRequest } = await provider.makeInvoice({ amount: 1000 });
const balance = await provider.getBalance?.();

```

#### Check the provider kind to get access to the underlying provider

```ts
import { WebLNProviders, requestProvider } from "@getalby/bitcoin-connect";

const provider = await requestProvider();

if (provider instanceof WebLNProviders.NostrWebLNProvider) {
  provider.client.nostrWalletConnectUrl; // access the connection secret
}
```

### Programmatic connection

```ts
import { connectNWC, disconnect } from "@getalby/bitcoin-connect";

// Connect directly with NWC URL
connectNWC("nostr+walletconnect://...");

// Disconnect and clear saved configuration
disconnect();
```

## React components

```tsx
import { Button, PayButton, Connect, Payment } from "@getalby/bitcoin-connect-react";
import { init } from "@getalby/bitcoin-connect-react";

// Initialize once at app startup
init({ appName: "My App" });

// Connection button - launches modal when clicked
<Button />

// Pay button - launches payment modal when clicked
<PayButton
  invoice="lnbc..."
  onPaid={(response) => console.log("Paid!", response.preimage)}
/>

// Inline connect flow (no modal)
<Connect
  onConnected={(provider) => console.log("Connected!", provider)}
/>

// Inline payment flow (no modal)
<Payment
  invoice="lnbc..."
  onPaid={(response) => console.log("Paid!", response.preimage)}
/>
```

## Web components

```html
<!-- Initialize Bitcoin Connect -->
<script type="module">
  import {init} from 'https://esm.sh/@getalby/bitcoin-connect@3';
  init({ appName: "My App" });
</script>

<!-- Connection button -->
<bc-button></bc-button>

<!-- Pay button -->
<bc-pay-button invoice="lnbc..."></bc-pay-button>

<!-- Inline connect flow -->
<bc-connect></bc-connect>

<!-- Inline payment flow -->
<bc-payment invoice="lnbc..."></bc-payment>
```

## Events

```ts
import {
  onConnected,
  onDisconnected,
  onConnecting,
  onModalOpened,
  onModalClosed,
} from "@getalby/bitcoin-connect";

// Subscribe to wallet connection
const unsubscribe = onConnected((provider) => {
  console.log("Wallet connected!", provider);
});

// Subscribe to disconnection
onDisconnected(() => {
  console.log("Wallet disconnected");
});

// Subscribe to modal events
onModalOpened(() => console.log("Modal opened"));
onModalClosed(() => console.log("Modal closed"));

// Unsubscribe when done
unsubscribe();
```

## Referenced files

- [Bitcoin Connect typings](./bundle.d.ts)
- [Bitcoin Connect React typings](./react.bundle.d.ts)
