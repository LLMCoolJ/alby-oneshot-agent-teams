import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.subtle for tests
const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: vi.fn().mockImplementation(async (_algorithm: string, _data: ArrayBuffer) => {
      // Return a mock 32-byte hash
      return new Uint8Array(32).buffer;
    }),
  },
};

vi.stubGlobal('crypto', mockCrypto);

// Mock WebSocket for NWC tests
vi.stubGlobal('WebSocket', vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})));
