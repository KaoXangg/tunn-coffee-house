import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { SiteDataProvider } from './contexts/SiteDataContext';
import { CustomerHomePage } from './pages/CustomerHomePage';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

// Route-based lazy loading for Admin CMS modules
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminCategoriesPage = lazy(() =>
  import('./pages/admin/AdminCategoriesPage').then((m) => ({
    default: m.AdminCategoriesPage,
  }))
);
const AdminMediaPage = lazy(() =>
  import('./pages/admin/AdminMediaPage').then((m) => ({ default: m.AdminMediaPage }))
);
const AdminHeroEditorPage = lazy(() =>
  import('./pages/admin/AdminHeroEditorPage').then((m) => ({
    default: m.AdminHeroEditorPage,
  }))
);
const AdminContentPage = lazy(() =>
  import('./pages/admin/AdminContentPage').then((m) => ({
    default: m.AdminContentPage,
  }))
);
const AdminPromotionsPage = lazy(() =>
  import('./pages/admin/AdminPromotionsPage').then((m) => ({
    default: m.AdminPromotionsPage,
  }))
);
const AdminGalleryPage = lazy(() =>
  import('./pages/admin/AdminGalleryPage').then((m) => ({
    default: m.AdminGalleryPage,
  }))
);
const AdminBrandPage = lazy(() =>
  import('./pages/admin/AdminBrandPage').then((m) => ({ default: m.AdminBrandPage }))
);
const AdminAppearancePage = lazy(() =>
  import('./pages/admin/AdminAppearancePage').then((m) => ({
    default: m.AdminAppearancePage,
  }))
);
const AdminContactPage = lazy(() =>
  import('./pages/admin/AdminContactPage').then((m) => ({
    default: m.AdminContactPage,
  }))
);
const AdminSeoPage = lazy(() =>
  import('./pages/admin/AdminSeoPage').then((m) => ({ default: m.AdminSeoPage }))
);
const AdminBackupQrPage = lazy(() =>
  import('./pages/admin/AdminBackupQrPage').then((m) => ({
    default: m.AdminBackupQrPage,
  }))
);
const AdminSecurityPage = lazy(() =>
  import('./pages/admin/AdminSecurityPage').then((m) => ({
    default: m.AdminSecurityPage,
  }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#4B2E24]">
    <Loader2 className="w-7 h-7 animate-spin mb-2" />
    <span className="font-serif text-base">Đang tải...</span>
  </div>
);

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SiteDataProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Customer Website */}
                <Route path="/" element={<CustomerHomePage />} />

                {/* Admin Authentication */}
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Protected Admin CMS */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="media" element={<AdminMediaPage />} />
                  <Route path="sections/hero" element={<AdminHeroEditorPage />} />
                  <Route path="content" element={<AdminContentPage />} />
                  <Route path="promotions" element={<AdminPromotionsPage />} />
                  <Route path="gallery" element={<AdminGalleryPage />} />
                  <Route path="brand" element={<AdminBrandPage />} />
                  <Route path="settings/appearance" element={<AdminAppearancePage />} />
                  <Route path="settings/contact" element={<AdminContactPage />} />
                  <Route path="settings/seo" element={<AdminSeoPage />} />
                  <Route path="settings/backup" element={<AdminBackupQrPage />} />
                  <Route path="settings/security" element={<AdminSecurityPage />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SiteDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
