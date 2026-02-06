import { useState, useCallback, useRef, useEffect } from 'react';
import { useNWCClient } from './useNWCClient';
import { useWalletActions } from './useWalletActions';
import type { WalletId, NotificationEvent, NotificationType, Transaction } from '@/types';
import type { Nip47Notification, Nip47NotificationType } from '@getalby/sdk/nwc';

interface UseNotificationsOptions {
  onNotification?: (event: NotificationEvent) => void;
  notificationTypes?: NotificationType[];
}

interface UseNotificationsReturn {
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => void;
  error: string | null;
}

export function useNotifications(
  walletId: WalletId,
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const client = useNWCClient(walletId);
  const { refreshBalance } = useWalletActions(walletId);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleNotification = useCallback((notification: Nip47Notification) => {
    // Convert SDK notification to our type
    const tx = notification.notification;
    const transaction: Transaction = {
      id: tx.payment_hash,
      type: tx.type,
      state: tx.state,
      amount: tx.amount, // millisats
      feesPaid: tx.fees_paid, // millisats
      description: tx.description,
      invoice: tx.invoice,
      preimage: tx.preimage || null,
      paymentHash: tx.payment_hash,
      createdAt: new Date(tx.created_at * 1000),
      settledAt: tx.settled_at ? new Date(tx.settled_at * 1000) : null,
      expiresAt: tx.expires_at ? new Date(tx.expires_at * 1000) : null,
      metadata: tx.metadata ? {
        comment: tx.metadata.comment,
        payerData: tx.metadata.payer_data,
        recipientData: tx.metadata.recipient_data,
        nostr: tx.metadata.nostr,
      } : undefined,
    };

    const event: NotificationEvent = {
      type: notification.notification_type as NotificationType,
      transaction,
      timestamp: new Date(),
    };

    options.onNotification?.(event);

    // Refresh balance on payment events
    if (notification.notification_type === 'payment_received' ||
        notification.notification_type === 'payment_sent') {
      refreshBalance();
    }
  }, [options.onNotification, refreshBalance]);

  const subscribe = useCallback(async () => {
    if (!client) {
      setError('Wallet not connected');
      return;
    }

    setError(null);

    try {
      const unsub = await client.subscribeNotifications(
        handleNotification,
        options.notificationTypes as Nip47NotificationType[]
      );

      unsubscribeRef.current = unsub;
      setIsSubscribed(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
      throw err;
    }
  }, [client, handleNotification, options.notificationTypes]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsSubscribed(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    error,
  };
}
