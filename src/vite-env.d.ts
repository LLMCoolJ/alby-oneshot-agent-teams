/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ALICE_NWC_URL?: string;
  readonly VITE_BOB_NWC_URL?: string;
  readonly VITE_DEFAULT_NETWORK: string;
  readonly VITE_ENABLE_DEMO_MODE: string;
  readonly VITE_ENABLE_FIAT_DISPLAY: string;
  readonly VITE_DEFAULT_FIAT_CURRENCY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
