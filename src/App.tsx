import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import CredentialsPage from "./pages/CredentialsPage";
import HomePage from "./pages/HomePage";
import BasalamCallback from "./pages/BasalamCallback";
import LandingPage from "./pages/LandingPage"; // <-- **این خط را اضافه کنید**
import SettingsPage from "./pages/SettingsPage";
import PricingPage from "./pages/PricingPage";
import UsagePage from "./pages/UsagePage";
import SubscriptionPage from "./pages/SubscriptionPage";
import PaymentsPage from "./pages/PaymentsPage";
import MigrationPage from "./pages/MigrationPage";
import AdminPage from "./pages/AdminPage";
import SupportPage from "./pages/SupportPage";
import TokenExpiredModal from "./components/TokenExpiredModal";
import { useGlobalUiStore } from "./store/globalUiStore";
import QuotaBanner from "./components/QuotaBanner";

const queryClient = new QueryClient();

// PrivateRoute logic remains the same, but the redirect path changes
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // Redirect to /login if not authenticated, as LandingPage is now at /
  return isAuthenticated() ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace={true} />
  );
}

function WithGlobalOverlays({ children }: { children: React.ReactNode }) {
  const showTokenExpiredModal = useGlobalUiStore(
    (state) => state.showTokenExpiredModal,
  );
  const showQuotaBanner = useGlobalUiStore((state) => state.showQuotaBanner);
  const quotaBannerType = useGlobalUiStore((state) => state.quotaBannerType);
  const setQuotaBanner = useGlobalUiStore((state) => state.setQuotaBanner);
  const location = useLocation();

  const shouldShowQuotaBanner =
    showQuotaBanner &&
    (location.pathname === "/home" || location.pathname === "/migration");

  return (
    <>
      <TokenExpiredModal open={showTokenExpiredModal} />
      {shouldShowQuotaBanner && (
        <QuotaBanner
          open={showQuotaBanner}
          type={quotaBannerType}
          onClose={() => setQuotaBanner(false, null)}
        />
      )}
      {children}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <WithGlobalOverlays>
          <Routes>
            {/* 1. LandingPage will now be the default route */}
            <Route path="/" element={<LandingPage />} />

            {/* 2. CredentialsPage moved to a new path, e.g., /login */}
            <Route path="/login" element={<CredentialsPage />} />

            {/* Pricing Page route */}
            <Route path="/pricing" element={<PricingPage />} />

            {/* Usage Dashboard route */}
            <Route
              path="/usage"
              element={
                <PrivateRoute>
                  <UsagePage />
                </PrivateRoute>
              }
            />

            {/* Subscription Management route */}
            <Route
              path="/subscription"
              element={
                <PrivateRoute>
                  <SubscriptionPage />
                </PrivateRoute>
              }
            />

            {/* Payments History route */}
            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <PaymentsPage />
                </PrivateRoute>
              }
            />

            {/* Migration route */}
            <Route
              path="/migration"
              element={
                <PrivateRoute>
                  <MigrationPage />
                </PrivateRoute>
              }
            />

            {/* Admin route */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminPage />
                </PrivateRoute>
              }
            />

            {/* Other existing routes */}
            <Route path="/basalam/callback" element={<BasalamCallback />} />

            {/* Protected HomePage route */}
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />

            {/* Protected Support route */}
            <Route
              path="/support"
              element={
                <PrivateRoute>
                  <SupportPage />
                </PrivateRoute>
              }
            />

            {/* Protected Settings route */}
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </WithGlobalOverlays>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
