import { useState, useCallback } from 'react';
import { Button, Badge } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { CONSTANTS } from '@/types';
import type { NotificationEvent } from '@/types';

interface NotificationSubscriberProps {
  onLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function NotificationSubscriber({ onLog }: NotificationSubscriberProps) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  const handleNotification = useCallback((event: NotificationEvent) => {
    setNotifications((prev) => [event, ...prev].slice(0, 50)); // Keep last 50
    const amountSats = Math.floor(event.transaction.amount / CONSTANTS.MILLISATS_PER_SAT);
    onLog(`Received ${amountSats.toLocaleString()} sats`, 'success');
  }, [onLog]);

  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    error,
  } = useNotifications('bob', {
    onNotification: handleNotification,
    notificationTypes: ['payment_received'],
  });

  const handleToggle = async () => {
    if (isSubscribed) {
      unsubscribe();
      onLog('Stopped listening for notifications', 'info');
    } else {
      onLog('Subscribing to payment notifications...', 'info');
      try {
        await subscribe();
        onLog('Now listening for incoming payments', 'success');
      } catch (err) {
        onLog(`Failed to subscribe: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Status:</span>
          {isSubscribed ? (
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Listening
              </span>
            </Badge>
          ) : (
            <Badge variant="default">Not listening</Badge>
          )}
        </div>
        <Button
          variant={isSubscribed ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleToggle}
          data-testid="subscribe-button"
        >
          {isSubscribed ? 'Stop Listening' : 'Start Listening'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Notifications list */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Incoming Payments
        </h4>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-center">
            {isSubscribed
              ? 'Waiting for payments...'
              : 'Start listening to see incoming payments'
            }
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto" data-testid="notification-list">
            {notifications.map((notification) => (
              <NotificationItem key={notification.transaction.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification }: { notification: NotificationEvent }) {
  const amountSats = Math.floor(notification.transaction.amount / CONSTANTS.MILLISATS_PER_SAT);
  const timeStr = notification.timestamp.toLocaleTimeString();

  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <span className="text-lg">⚡</span>
      <div className="flex-1">
        <span className="font-medium text-green-800">
          +{amountSats.toLocaleString()} sats
        </span>
        {notification.transaction.description && (
          <p className="text-xs text-green-700 truncate">
            {notification.transaction.description}
          </p>
        )}
      </div>
      <span className="text-xs text-green-600">{timeStr}</span>
    </div>
  );
}
