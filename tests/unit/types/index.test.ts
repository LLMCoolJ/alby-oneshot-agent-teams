import { describe, it, expect } from 'vitest';
import {
  isValidNwcUrl,
  isLightningAddress,
  isConnectedWallet,
  isSettledTransaction,
  CONSTANTS,
} from '@/types';
import type { WalletState, Transaction } from '@/types';

describe('Type Guards', () => {
  describe('isValidNwcUrl', () => {
    it('returns true for valid NWC URLs', () => {
      const validUrl = 'nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=abc123';
      expect(isValidNwcUrl(validUrl)).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isValidNwcUrl('https://example.com')).toBe(false);
      expect(isValidNwcUrl('nostr://something')).toBe(false);
      expect(isValidNwcUrl('')).toBe(false);
    });
  });

  describe('isLightningAddress', () => {
    it('returns true for valid Lightning Addresses', () => {
      expect(isLightningAddress('alice@getalby.com')).toBe(true);
      expect(isLightningAddress('bob_123@testnet.getalby.com')).toBe(true);
    });

    it('returns false for invalid addresses', () => {
      expect(isLightningAddress('not-an-email')).toBe(false);
      expect(isLightningAddress('@missing.user')).toBe(false);
      expect(isLightningAddress('missing@domain')).toBe(false);
    });
  });

  describe('isConnectedWallet', () => {
    it('returns true for fully connected wallet', () => {
      const wallet: WalletState = {
        id: 'alice',
        status: 'connected',
        nwcUrl: 'nostr+walletconnect://...',
        balance: 100000,
        info: {
          alias: 'Alice',
          color: '#ff0000',
          pubkey: 'abc123',
          network: 'testnet',
          blockHeight: 12345,
          methods: ['pay_invoice', 'make_invoice'],
        },
        error: null,
      };
      expect(isConnectedWallet(wallet)).toBe(true);
    });

    it('returns false for disconnected wallet', () => {
      const wallet: WalletState = {
        id: 'alice',
        status: 'disconnected',
        nwcUrl: null,
        balance: null,
        info: null,
        error: null,
      };
      expect(isConnectedWallet(wallet)).toBe(false);
    });
  });

  describe('isSettledTransaction', () => {
    it('returns true for settled transaction with preimage', () => {
      const tx: Transaction = {
        id: 'abc123',
        type: 'incoming',
        state: 'settled',
        amount: 1000000,
        feesPaid: 0,
        description: 'Test payment',
        invoice: 'lnbc...',
        preimage: 'preimage123',
        paymentHash: 'hash123',
        createdAt: new Date(),
        settledAt: new Date(),
        expiresAt: null,
      };
      expect(isSettledTransaction(tx)).toBe(true);
    });

    it('returns false for pending transaction', () => {
      const tx: Transaction = {
        id: 'abc123',
        type: 'incoming',
        state: 'pending',
        amount: 1000000,
        feesPaid: 0,
        description: 'Test payment',
        invoice: 'lnbc...',
        preimage: null,
        paymentHash: 'hash123',
        createdAt: new Date(),
        settledAt: null,
        expiresAt: null,
      };
      expect(isSettledTransaction(tx)).toBe(false);
    });
  });
});

describe('Constants', () => {
  it('has correct unit conversions', () => {
    expect(CONSTANTS.MILLISATS_PER_SAT).toBe(1000);
    expect(CONSTANTS.SATS_PER_BTC).toBe(100_000_000);
  });

  it('has valid payment limits', () => {
    expect(CONSTANTS.MIN_PAYMENT_SATS).toBeGreaterThan(0);
    expect(CONSTANTS.MAX_PAYMENT_SATS).toBeGreaterThan(CONSTANTS.MIN_PAYMENT_SATS);
  });
});
