import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('has crypto.getRandomValues available', () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    expect(array.some(v => v !== 0)).toBe(true);
  });

  it('has crypto.subtle.digest available', async () => {
    const data = new TextEncoder().encode('test');
    const hash = await crypto.subtle.digest('SHA-256', data);
    expect(hash).toBeInstanceOf(ArrayBuffer);
  });

  it('has environment variables defined', () => {
    expect(import.meta.env.VITE_DEFAULT_NETWORK).toBeDefined();
  });
});
