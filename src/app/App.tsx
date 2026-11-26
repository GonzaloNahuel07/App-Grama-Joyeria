import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { AdminOrdersPlaceholderPage } from '../features/admin/pages/AdminOrdersPlaceholderPage';
import { AdminSettingsPage } from '../features/admin/pages/AdminSettingsPage';
import { AdminStockPlaceholderPage } from '../features/admin/pages/AdminStockPlaceholderPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { CatalogHomePage } from '../features/catalog/pages/CatalogHomePage';
import { CheckoutPlaceholderPage } from '../features/catalog/pages/CheckoutPlaceholderPage';
import { ShippingContactPage } from '../features/catalog/pages/ShippingContactPage';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AppProvider } from './providers/AppProvider';

/**
 * Root application router separating the public catalog storefront from the partner admin area.
 */
export function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<CatalogHomePage />} />
          <Route path="envios" element={<ShippingContactPage />} />
          <Route path="pedido" element={<CheckoutPlaceholderPage />} />
        </Route>

        <Route path="login" element={<LoginPage />} />

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="stock" element={<AdminStockPlaceholderPage />} />
          <Route path="pedidos" element={<AdminOrdersPlaceholderPage />} />
          <Route path="config" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
