import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/auth.store";
import { DashboardLayout } from "./components/DashboardLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardPage } from "./pages/overview/DashboardPage";
import { ProductsPage } from "./pages/products/ProductsPage";
import { CustomersPage } from "./pages/customers/CustomersPage";
import { TransactionsPage } from "./pages/transactions/TransactionsPage";
import { TransactionDetailsPage } from "./pages/transactions/TransactionDetailsPage";
import { SubscriptionsPage } from "./pages/subscriptions/SubscriptionsPage";
import { PaymentLinksPage } from "./pages/payment-links/PaymentLinksPage";
import { AnalyticsPage } from "./pages/analytics/AnalyticsPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { PayPage } from "./pages/checkout/PayPage";
import { WalletPage } from "./pages/wallet/Wallet";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <>{children}</>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Public payment pages — NO auth needed */}
        <Route path="/pay/:id" element={<PayPage />} />

        {/* Protected dashboard */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/:id" element={<TransactionDetailsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="payment-links" element={<PaymentLinksPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="wallet" element={<WalletPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
