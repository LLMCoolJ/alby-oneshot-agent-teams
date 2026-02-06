/**
 * Creates a throw-away test wallet from the NWC faucet.
 * Each test can create fresh wallets for reproducible results.
 */
export async function createTestWallet(
  options: { balance?: number; retries?: number } = {}
): Promise<{ nwcUrl: string; lightningAddress: string }> {
  const { balance = 10000, retries = 3 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(
        `https://faucet.nwc.dev?balance=${balance}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw new Error(
          `Faucet request failed: ${response.status} ${await response.text()}`
        );
      }

      const nwcUrl = (await response.text()).trim();

      // Extract lightning address from lud16 parameter
      const lud16Match = nwcUrl.match(/lud16=([^&\s]+)/);
      if (!lud16Match) {
        throw new Error(`No lud16 found in NWC URL: ${nwcUrl}`);
      }

      const lightningAddress = decodeURIComponent(lud16Match[1]);

      return { nwcUrl, lightningAddress };
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error('Failed to create test wallet after retries');
}

/**
 * Top up an existing test wallet
 */
export async function topupTestWallet(
  lightningAddress: string,
  amount: number = 1000
): Promise<void> {
  const username = lightningAddress.split('@')[0];

  const response = await fetch(
    `https://faucet.nwc.dev/wallets/${username}/topup?amount=${amount}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error(`Topup failed: ${response.status} ${await response.text()}`);
  }
}

/**
 * Creates a pair of test wallets (Alice and Bob) for two-party scenarios
 */
export async function createTestWalletPair(
  options: { aliceBalance?: number; bobBalance?: number } = {}
): Promise<{
  alice: { nwcUrl: string; lightningAddress: string };
  bob: { nwcUrl: string; lightningAddress: string };
}> {
  const { aliceBalance = 10000, bobBalance = 10000 } = options;

  const [alice, bob] = await Promise.all([
    createTestWallet({ balance: aliceBalance }),
    createTestWallet({ balance: bobBalance }),
  ]);

  return { alice, bob };
}
