import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useWallet, useWalletActions } from '@/hooks';
import { isValidNwcUrl } from '@/types';
import type { WalletId } from '@/types';

interface WalletConnectProps {
  walletId: WalletId;
}

export function WalletConnect({ walletId }: WalletConnectProps) {
  const wallet = useWallet(walletId);
  const { connect } = useWalletActions(walletId);
  const [nwcUrl, setNwcUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!isValidNwcUrl(nwcUrl)) {
      setValidationError('Invalid NWC URL. Must start with nostr+walletconnect://');
      return;
    }

    setValidationError(null);
    try {
      await connect(nwcUrl);
    } catch (error) {
      // Error is handled in context
    }
  };

  return (
    <div className="space-y-4">
      <Input
        data-testid="nwc-url-input"
        label="NWC Connection String"
        placeholder="nostr+walletconnect://..."
        value={nwcUrl}
        onChange={(e) => setNwcUrl(e.target.value)}
        error={validationError || wallet.error || undefined}
        hint="Paste your Nostr Wallet Connect URL"
      />
      <Button
        data-testid="connect-wallet-btn"
        onClick={handleConnect}
        loading={wallet.status === 'connecting'}
        disabled={!nwcUrl}
      >
        Connect Wallet
      </Button>
    </div>
  );
}
