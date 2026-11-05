import { Routes, Route, Navigate } from 'react-router-dom'
import { SubscriptionGuard } from '@/components/auth/SubscriptionGuard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SubscriptionRoute } from '@/components/auth/SubscriptionRoute'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { SignupsClosedRedirect } from '@/components/auth/SignupsClosedRedirect'
import { SIGNUPS_ENABLED } from '@/lib/signups-enabled'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'
import { PricingPage } from '@/pages/PricingPage'
import { PricingSuccessPage } from '@/pages/PricingSuccessPage'
// Billing now lives in the settings page's Subscription section; /billing redirects there.
// import { BillingPage } from '@/pages/BillingPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { WalletsPage } from '@/pages/WalletsPage'
import { WalletAnalysisPage } from '@/pages/WalletAnalysisPage'
// TOKENS PAGE DISABLED — page kept in the tree, just not routed. Old links go to the wallets page.
// import { TokensPage } from '@/pages/TokensPage'
import { InsidersPage } from '@/pages/InsidersPage'
import { ScannerPage } from '@/pages/ScannerPage'
import { WatchlistPage } from '@/pages/WatchlistPage'
import { SELECT_PLAN_PATH } from '@/lib/subscription-routes'

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
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        {/* Not a guest route: the reset email's link works whether or not this browser is logged in. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/signup"
          element={
            SIGNUPS_ENABLED ? (
              <GuestRoute>
                <SignupPage />
              </GuestRoute>
            ) : (
              <SignupsClosedRedirect />
            )
          }
        />

        {/* Auth required, subscription exempt. Only routed while the paywall is on. */}
        {SUBSCRIPTIONS_ENABLED ? (
          <>
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
          </>
        ) : null}

        {/* Account settings, including the subscription. Needs a login but not a plan, so people
            without one can still subscribe or fix a failed payment from here. */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        {/* Billing moved into settings. Old links and Stripe's portal return here. */}
        <Route path="/billing" element={<Navigate to="/settings?tab=subscription" replace />} />

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
        {/* TOKENS PAGE DISABLED — un-comment together with the import above to restore it.
        <Route
          path="/tokens"
          element={
            <SubscriptionRoute>
              <TokensPage />
            </SubscriptionRoute>
          }
        />
        */}
        <Route path="/tokens" element={<Navigate to="/wallets" replace />} />
        <Route
          path="/scanner"
          element={
            <SubscriptionRoute>
              <ScannerPage />
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
