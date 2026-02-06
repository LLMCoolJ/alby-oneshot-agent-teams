import { fromHexString, Invoice } from '@getalby/lightning-tools/bolt11';

// Re-export SDK utility for hex decoding
export { fromHexString };

/**
 * Convert bytes to hex string.
 * Simple string conversion utility (not crypto).
 */
export function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random preimage and its SHA-256 hash for hold invoices.
 *
 * Uses Web Crypto API (platform crypto):
 * - crypto.getRandomValues() for secure random bytes
 * - crypto.subtle.digest() for SHA-256 hashing
 *
 * This is appropriate because we're generating values, not verifying claims.
 * The SDK doesn't provide a generation helper since wallets normally handle this.
 */
export async function generatePreimageAndHash(): Promise<{
  preimage: string;
  paymentHash: string;
}> {
  // Generate 32 random bytes for preimage using platform crypto
  const preimageBytes = crypto.getRandomValues(new Uint8Array(32));
  const preimage = toHexString(preimageBytes);

  // Hash the preimage with SHA-256 using platform crypto
  const hashBuffer = await crypto.subtle.digest('SHA-256', preimageBytes);
  const paymentHash = toHexString(new Uint8Array(hashBuffer));

  return { preimage, paymentHash };
}

/**
 * Verify that a preimage matches an invoice's payment hash.
 *
 * Uses SDK's Invoice.validatePreimage() - don't roll your own crypto for verification!
 *
 * @param invoiceString - BOLT-11 invoice string (e.g., "lnbc...")
 * @param preimage - Hex-encoded preimage to verify
 * @returns true if SHA256(preimage) matches the invoice's payment_hash
 */
export function verifyPreimage(invoiceString: string, preimage: string): boolean {
  const invoice = new Invoice({ pr: invoiceString });
  return invoice.validatePreimage(preimage);
}
