import { Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from '@/context/WalletContext';
import { Layout } from '@/components/layout/Layout';

// Lazy load scenario pages
import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui';

const SimplePayment = lazy(() => import('@/pages/1-SimplePayment'));
const LightningAddress = lazy(() => import('@/pages/2-LightningAddress'));
const Notifications = lazy(() => import('@/pages/3-Notifications'));
const HoldInvoice = lazy(() => import('@/pages/4-HoldInvoice'));
const ProofOfPayment = lazy(() => import('@/pages/5-ProofOfPayment'));
const TransactionHistory = lazy(() => import('@/pages/6-TransactionHistory'));
const NostrZap = lazy(() => import('@/pages/7-NostrZap'));
const FiatConversion = lazy(() => import('@/pages/8-FiatConversion'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/simple-payment" replace />} />
            <Route path="/simple-payment" element={<SimplePayment />} />
            <Route path="/lightning-address" element={<LightningAddress />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/hold-invoice" element={<HoldInvoice />} />
            <Route path="/proof-of-payment" element={<ProofOfPayment />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/nostr-zap" element={<NostrZap />} />
            <Route path="/fiat-conversion" element={<FiatConversion />} />
          </Routes>
        </Suspense>
      </Layout>
    </WalletProvider>
  );
}
