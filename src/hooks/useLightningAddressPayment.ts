import { useState, useCallback } from 'react';
import { LightningAddress } from '@getalby/lightning-tools/lnurl';
import { useNWCClient } from './useNWCClient';
import { useWalletActions } from './useWalletActions';
import type { WalletId, LightningAddressPayment, PaymentResult } from '@/types';

interface AddressInfo {
  min: number;
  max: number;
  description: string;
  commentAllowed: number | undefined;
  fixed: boolean;
}

interface UseLightningAddressPaymentReturn {
  payToAddress: (payment: LightningAddressPayment) => Promise<PaymentResult>;
  fetchAddressInfo: (address: string) => Promise<AddressInfo>;
  loading: boolean;
  error: string | null;
  addressInfo: AddressInfo | null;
  result: PaymentResult | null;
  reset: () => void;
}

export function useLightningAddressPayment(walletId: WalletId): UseLightningAddressPaymentReturn {
  const client = useNWCClient(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  // Cache LightningAddress instances
  const [lnAddress, setLnAddress] = useState<LightningAddress | null>(null);

  const fetchAddressInfo = useCallback(async (address: string): Promise<AddressInfo> => {
    setLoading(true);
    setError(null);

    try {
      const ln = new LightningAddress(address);
      await ln.fetch();
      setLnAddress(ln);

      if (!ln.lnurlpData) {
        throw new Error('Failed to fetch LNURL-pay data');
      }

      const info: AddressInfo = {
        min: ln.lnurlpData.min,
        max: ln.lnurlpData.max,
        description: ln.lnurlpData.description,
        commentAllowed: ln.lnurlpData.commentAllowed,
        fixed: ln.lnurlpData.fixed,
      };

      setAddressInfo(info);
      return info;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch address info';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const payToAddress = useCallback(async (payment: LightningAddressPayment): Promise<PaymentResult> => {
    if (!client) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Use cached LightningAddress or create new one
      let ln = lnAddress;
      if (!ln || ln.address !== payment.address) {
        ln = new LightningAddress(payment.address);
        await ln.fetch();
        setLnAddress(ln);
      }

      // Request invoice from the Lightning Address
      const invoice = await ln.requestInvoice({
        satoshi: payment.amount, // sats
        comment: payment.comment,
      });

      // Pay the invoice
      const response = await client.payInvoice({ invoice: invoice.paymentRequest });

      const paymentResult: PaymentResult = {
        preimage: response.preimage,
        feesPaid: response.fees_paid, // millisats
      };

      setResult(paymentResult);
      await refreshBalance();

      return paymentResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, lnAddress, refreshBalance]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setAddressInfo(null);
    setLnAddress(null);
  }, []);

  return {
    payToAddress,
    fetchAddressInfo,
    loading,
    error,
    addressInfo,
    result,
    reset,
  };
}
