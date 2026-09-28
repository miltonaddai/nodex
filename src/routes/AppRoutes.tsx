import { Routes, Route, Navigate } from 'react-router-dom'
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard'
// SUBSCRIPTIONS DISABLED — only wraps the commented-out pricing/billing routes below.
// import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SubscriptionRoute } from '@/components/auth/SubscriptionRoute'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
// SUBSCRIPTIONS DISABLED — pages kept in the tree, just not routed.
// import { PricingPage } from '@/pages/PricingPage'
// import { PricingSuccessPage } from '@/pages/PricingSuccessPage'
// import { BillingPage } from '@/pages/BillingPage'
import { WalletsPage } from '@/pages/WalletsPage'
import { WalletAnalysisPage } from '@/pages/WalletAnalysisPage'
import { TokensPage } from '@/pages/TokensPage'
import { InsidersPage } from '@/pages/InsidersPage'
import { WatchlistPage } from '@/pages/WatchlistPage'
// SUBSCRIPTIONS DISABLED — only referenced by the commented-out pricing route below.
// import { SELECT_PLAN_PATH } from '@/lib/subscription-routes'

export function AppRoutes() {
  return (
    <SubscriptionGuard>
      <Routes>
        {/* Public — no auth */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignupPage />
            </GuestRoute>
          }
        />

        {/* SUBSCRIPTIONS DISABLED — auth-required, subscription-exempt routes.
            Un-comment together with the imports above to restore the paywall.
        <Route
          path={SELECT_PLAN_PATH}
          element={
            <ProtectedRoute>
              <PricingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing/success"
          element={
            <ProtectedRoute>
              <PricingSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        */}

        {/* Subscription required — redirect to select plan if inactive */}
        <Route
          path="/wallets"
          element={
            <SubscriptionRoute>
              <WalletsPage />
            </SubscriptionRoute>
          }
        />
        <Route
          path="/wallets/:address"
          element={
            <SubscriptionRoute>
              <WalletAnalysisPage />
            </SubscriptionRoute>
          }
        />
        <Route
          path="/tokens"
          element={
            <SubscriptionRoute>
              <TokensPage />
            </SubscriptionRoute>
          }
        />
        <Route
          path="/insiders"
          element={
            <SubscriptionRoute>
              <InsidersPage />
            </SubscriptionRoute>
          }
        />
        <Route
          path="/watchlist"
          element={
            <SubscriptionRoute>
              <WatchlistPage />
            </SubscriptionRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SubscriptionGuard>
  )
}
