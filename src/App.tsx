import React, { Suspense, lazy, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { SiteDataProvider } from './contexts/SiteDataContext';
import { SeasonalThemeProvider } from './contexts/SeasonalThemeContext';
import { CustomerHomePage } from './pages/CustomerHomePage';
const ProtectedRoute = lazy(() =>
  import('./components/admin/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute }))
);
const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);

function lazyWithRetry<T extends ComponentType<Record<string, unknown>>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const reloadKey = 'tunn_chunk_retry_v1';
    try {
      const mod = await importer();
      try {
        sessionStorage.removeItem(reloadKey);
      } catch {
        // ignore
      }
      return mod;
    } catch (err) {
      try {
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, '1');
          window.location.reload();
        }
      } catch {
        // ignore
      }
      throw err;
    }
  });
}

// Route-based lazy loading for Admin CMS modules (with stale-chunk recovery)
const AdminLoginPage = lazyWithRetry(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazyWithRetry(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminProductsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminCategoriesPage = lazyWithRetry(() =>
  import('./pages/admin/AdminCategoriesPage').then((m) => ({
    default: m.AdminCategoriesPage,
  }))
);
const AdminMediaPage = lazyWithRetry(() =>
  import('./pages/admin/AdminMediaPage').then((m) => ({ default: m.AdminMediaPage }))
);
const AdminHeroEditorPage = lazyWithRetry(() =>
  import('./pages/admin/AdminHeroEditorPage').then((m) => ({
    default: m.AdminHeroEditorPage,
  }))
);
const AdminContentPage = lazyWithRetry(() =>
  import('./pages/admin/AdminContentPage').then((m) => ({
    default: m.AdminContentPage,
  }))
);
const AdminPromotionsPage = lazyWithRetry(() =>
  import('./pages/admin/AdminPromotionsPage').then((m) => ({
    default: m.AdminPromotionsPage,
  }))
);
const AdminGalleryPage = lazyWithRetry(() =>
  import('./pages/admin/AdminGalleryPage').then((m) => ({
    default: m.AdminGalleryPage,
  }))
);
const AdminBrandPage = lazyWithRetry(() =>
  import('./pages/admin/AdminBrandPage').then((m) => ({ default: m.AdminBrandPage }))
);
const AdminAppearancePage = lazyWithRetry(() =>
  import('./pages/admin/AdminAppearancePage').then((m) => ({
    default: m.AdminAppearancePage,
  }))
);
const AdminContactPage = lazyWithRetry(() =>
  import('./pages/admin/AdminContactPage').then((m) => ({
    default: m.AdminContactPage,
  }))
);
const AdminSeoPage = lazyWithRetry(() =>
  import('./pages/admin/AdminSeoPage').then((m) => ({ default: m.AdminSeoPage }))
);
const AdminBackupQrPage = lazyWithRetry(() =>
  import('./pages/admin/AdminBackupQrPage').then((m) => ({
    default: m.AdminBackupQrPage,
  }))
);
const AdminSecurityPage = lazyWithRetry(() =>
  import('./pages/admin/AdminSecurityPage').then((m) => ({
    default: m.AdminSecurityPage,
  }))
);
const AdminSeasonalThemesPage = lazyWithRetry(() =>
  import('./pages/admin/AdminSeasonalThemesPage').then((m) => ({
    default: m.AdminSeasonalThemesPage,
  }))
);
const AdminFeedbackPage = lazyWithRetry(() =>
  import('./pages/admin/AdminFeedbackPage').then((m) => ({
    default: m.AdminFeedbackPage,
  }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-ivory-light text-coffee">
    <Loader2 className="w-7 h-7 animate-spin mb-2" />
    <span className="font-serif text-base">Đang tải...</span>
  </div>
);

export function App() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <SiteDataProvider>
            <SeasonalThemeProvider>
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
                  <Route path="seasonal-themes" element={<AdminSeasonalThemesPage />} />
                  <Route path="feedback" element={<AdminFeedbackPage />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            </BrowserRouter>
            </SeasonalThemeProvider>
          </SiteDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
    </LazyMotion>
  );
}

export default App;
