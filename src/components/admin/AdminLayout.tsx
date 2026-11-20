import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Coffee,
  FolderTree,
  Image as ImageIcon,
  Megaphone,
  GalleryHorizontalEnd,
  FileText,
  Sparkles,
  Award,
  Palette,
  PhoneCall,
  Globe,
  ShieldCheck,
  QrCode,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Database,
  AlertCircle,
  Clock,
  Crown,
  Lock,
  PartyPopper,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchTableFeedback } from '../../lib/feedback';
import { subscribeLiveSync } from '../../lib/liveSync';
import { BrandLogo } from '../common/BrandLogo';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  formatDurationVi,
  IDLE_TIMEOUT_STORAGE_KEY,
} from '../../lib/utils';

interface NavGroupItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

const CMS_NAV_ITEMS: NavGroupItem[] = [
  // Basic Operational Pages (Accessible by Sub-Managers & Owner Admin)
  { label: 'Tổng quan hệ thống', to: '/admin/dashboard', icon: LayoutDashboard, ownerOnly: false },
  { label: 'Quản lý Sản phẩm', to: '/admin/products', icon: Coffee, ownerOnly: false },
  { label: 'Quản lý Danh mục', to: '/admin/categories', icon: FolderTree, ownerOnly: false },
  { label: 'Chương trình Khuyến mãi', to: '/admin/promotions', icon: Megaphone, ownerOnly: false },
  { label: 'Thư viện Không gian', to: '/admin/gallery', icon: GalleryHorizontalEnd, ownerOnly: false },
  { label: 'Kho Hình ảnh (Media)', to: '/admin/media', icon: ImageIcon, ownerOnly: false },
  { label: 'Đánh giá Khách hàng', to: '/admin/feedback', icon: Star, ownerOnly: false },

  // System, Brand & Security Pages (Accessible ONLY by Root Owner Admin)
  { label: 'Banner Đầu trang', to: '/admin/sections/hero', icon: Sparkles, ownerOnly: true },
  { label: 'Nội dung Trang chủ', to: '/admin/content', icon: FileText, ownerOnly: true },
  { label: 'Nhận diện Thương hiệu', to: '/admin/brand', icon: Award, ownerOnly: true },
  { label: 'Màu sắc & Giao diện', to: '/admin/settings/appearance', icon: Palette, ownerOnly: true },
  { label: 'Giao diện Lễ hội (Seasonal)', to: '/admin/seasonal-themes', icon: PartyPopper, ownerOnly: true },
  { label: 'Thông tin Liên hệ', to: '/admin/settings/contact', icon: PhoneCall, ownerOnly: true },
  { label: 'Cấu hình SEO Google', to: '/admin/settings/seo', icon: Globe, ownerOnly: true },
  { label: 'Sao lưu & Mã QR Menu', to: '/admin/settings/backup', icon: QrCode, ownerOnly: true },
  { label: 'Bảo mật & Tài khoản', to: '/admin/settings/security', icon: ShieldCheck, ownerOnly: true },
];

export const AdminLayout: React.FC = () => {
  const { user, profile, isOwnerAdmin, signOut, isConfigured } = useAuth();
  const { isLiveDatabase, logAdminActivity, refreshAll } = useSiteData();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sessionElapsedSec, setSessionElapsedSec] = useState<number>(0);

  // Background-preload Admin route chunks so switching tabs is instant without white flashes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('../../pages/admin/AdminDashboardPage');
      void import('../../pages/admin/AdminProductsPage');
      void import('../../pages/admin/AdminCategoriesPage');
      void import('../../pages/admin/AdminPromotionsPage');
      void import('../../pages/admin/AdminGalleryPage');
      void import('../../pages/admin/AdminMediaPage');
      void import('../../pages/admin/AdminFeedbackPage');
      if (isOwnerAdmin) {
        void import('../../pages/admin/AdminHeroEditorPage');
        void import('../../pages/admin/AdminContentPage');
        void import('../../pages/admin/AdminBrandPage');
        void import('../../pages/admin/AdminAppearancePage');
        void import('../../pages/admin/AdminSeasonalThemesPage');
        void import('../../pages/admin/AdminContactPage');
        void import('../../pages/admin/AdminSeoPage');
        void import('../../pages/admin/AdminBackupQrPage');
        void import('../../pages/admin/AdminSecurityPage');
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [isOwnerAdmin]);

  const prevPageRef = useRef<{ path: string; label: string; enteredAt: number } | null>(null);
  const lastInteractionRef = useRef<number>(0);
  const [feedbackBadge, setFeedbackBadge] = useState<{
    unreadCount: number;
    hasLowRating: boolean;
  }>({ unreadCount: 0, hasLowRating: false });

  const refreshFeedbackBadge = useCallback(async () => {
    try {
      const { items } = await fetchTableFeedback();
      const rawLastSeen = localStorage.getItem('tunn_feedback_last_seen_at');
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const cutoffMs = rawLastSeen ? Number(rawLastSeen) || startOfToday.getTime() : startOfToday.getTime();

      const unreadItems = items.filter(
        (item) => new Date(item.created_at).getTime() > cutoffMs
      );
      setFeedbackBadge({
        unreadCount: unreadItems.length,
        hasLowRating: unreadItems.some((item) => Number(item.rating) <= 3),
      });
    } catch {
      // Non-critical badge fetch
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/feedback') {
      localStorage.setItem('tunn_feedback_last_seen_at', String(Date.now()));
      const clearTimer = window.setTimeout(() => {
        setFeedbackBadge({ unreadCount: 0, hasLowRating: false });
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }
    const timer = window.setTimeout(() => {
      void refreshFeedbackBadge();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, refreshFeedbackBadge]);

  useEffect(() => {
    const unsub = subscribeLiveSync((scope) => {
      if (scope === 'feedback' || scope === 'all') {
        if (location.pathname === '/admin/feedback') {
          localStorage.setItem('tunn_feedback_last_seen_at', String(Date.now()));
          setFeedbackBadge({ unreadCount: 0, hasLowRating: false });
        } else {
          void refreshFeedbackBadge();
        }
      }
    });
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && location.pathname !== '/admin/feedback') {
        void refreshFeedbackBadge();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [location.pathname, refreshFeedbackBadge]);

  const basicNavItems = CMS_NAV_ITEMS.filter((item) => !item.ownerOnly);
  const ownerNavItems = CMS_NAV_ITEMS.filter((item) => item.ownerOnly);

  const currentNav = CMS_NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.to)
  );
  const isBlockedOwnerRoute = Boolean(currentNav?.ownerOnly && !isOwnerAdmin);

  // Initialize session start time & live second counter
  useEffect(() => {
    let startMs = Number(sessionStorage.getItem('tunn_admin_session_start') || 0);
    let sessionId = sessionStorage.getItem('tunn_admin_session_id');
    if (!startMs || !sessionId) {
      startMs = Date.now();
      sessionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('tunn_admin_session_start', String(startMs));
      sessionStorage.setItem('tunn_admin_session_id', sessionId);
    }

    const updateTimer = () => {
      const s = Number(sessionStorage.getItem('tunn_admin_session_start') || startMs);
      setSessionElapsedSec(Math.max(1, Math.round((Date.now() - s) / 1000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Log initial session start when entering Admin
  useEffect(() => {
    if (!isConfigured || !user) return;
    const alreadyLogged = sessionStorage.getItem('tunn_admin_session_logged_start');
    if (!alreadyLogged) {
      sessionStorage.setItem('tunn_admin_session_logged_start', 'true');
      logAdminActivity(
        'Bắt đầu phiên làm việc (Đăng nhập Admin)',
        'session_start',
        currentNav?.label || 'Dashboard',
        { page_label: currentNav?.label || 'Dashboard' }
      ).then(() => refreshAll());
    }
  }, [isConfigured, user, currentNav?.label, logAdminActivity, refreshAll]);

  // Track page navigation & how long the manager stayed on each page
  useEffect(() => {
    if (!isConfigured || !user) return;
    const currentLabel = currentNav?.label || location.pathname;
    const now = Date.now();

    if (prevPageRef.current && prevPageRef.current.path !== location.pathname) {
      const spentSec = Math.max(1, Math.round((now - prevPageRef.current.enteredAt) / 1000));
      const prevLabel = prevPageRef.current.label;

      logAdminActivity(
        `Vào xem mục: ${currentLabel}`,
        'navigation',
        `Ở mục "${prevLabel}" trong ${formatDurationVi(spentSec)}`,
        {
          page_label: currentLabel,
          previous_page: prevLabel,
          previous_page_sec: spentSec,
        }
      );
    }

    prevPageRef.current = {
      path: location.pathname,
      label: currentLabel,
      enteredAt: now,
    };
  }, [location.pathname, currentNav?.label, isConfigured, user, logAdminActivity]);

  // Periodic active heartbeat every 2 minutes if manager is actively working on a single page
  useEffect(() => {
    if (!isConfigured || !user) return;
    const heartbeat = setInterval(() => {
      // Only log heartbeat if user interacted within the last 2 minutes
      if (Date.now() - lastInteractionRef.current < 120 * 1000) {
        const currentLabel = currentNav?.label || location.pathname;
        logAdminActivity(
          `Đang làm việc tại mục: ${currentLabel}`,
          'session_heartbeat',
          currentLabel,
          { page_label: currentLabel }
        );
      }
    }, 120 * 1000);

    return () => clearInterval(heartbeat);
  }, [isConfigured, user, currentNav?.label, location.pathname, logAdminActivity]);

  const handleLogout = useCallback(async () => {
    const startMs = Number(sessionStorage.getItem('tunn_admin_session_start') || Date.now());
    const totalSec = Math.max(1, Math.round((Date.now() - startMs) / 1000));

    if (isConfigured && user) {
      await logAdminActivity(
        'Kết thúc phiên làm việc (Đăng xuất)',
        'session_end',
        `Tổng thời gian hoạt động: ${formatDurationVi(totalSec)}`,
        { session_duration_sec: totalSec }
      );
    }

    sessionStorage.removeItem('tunn_cms_preview_unlocked');
    sessionStorage.removeItem('tunn_admin_session_id');
    sessionStorage.removeItem('tunn_admin_session_start');
    sessionStorage.removeItem('tunn_admin_session_logged_start');
    await signOut();
    navigate('/admin/login');
  }, [signOut, navigate, isConfigured, user, logAdminActivity]);

  // Auto Session Timeout (Idle Lock)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const resetIdleTimer = () => {
      lastInteractionRef.current = Date.now();
      if (timeoutId) clearTimeout(timeoutId);
      const savedMinutes = Number(
        localStorage.getItem(IDLE_TIMEOUT_STORAGE_KEY) ?? 30
      );
      if (savedMinutes <= 0) return;

      timeoutId = setTimeout(() => {
        toast.info(
          'Phiên quản trị đã tự động khóa',
          `Đã tự động đăng xuất sau ${savedMinutes} phút không thao tác để bảo vệ dữ liệu.`
        );
        handleLogout();
      }, savedMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'tunn-idle-timeout-updated'];
    events.forEach((ev) => window.addEventListener(ev, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
    };
  }, [handleLogout, toast]);

  return (
    <div className="min-h-screen bg-ivory-light text-coffee-dark flex">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 h-screen bg-white text-coffee-dark border-r border-coffee-beige/80 transition-all duration-300 shrink-0 z-40 ${
          collapsed ? 'w-20' : 'w-[268px]'
        }`}
      >
        <div
          className={`h-16 border-b border-coffee-beige/70 flex items-center shrink-0 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4 gap-2'
          }`}
        >
          {!collapsed && (
            <Link to="/admin/dashboard" className="min-w-0 flex items-center gap-2.5">
              <BrandLogo
                size="sm"
                showText
                subtitle="Admin CMS"
                textClassName="text-coffee-dark text-[15px] whitespace-nowrap"
              />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Mở rộng thanh công cụ' : 'Thu gọn thanh công cụ'}
            className={`text-coffee-muted hover:text-coffee-dark rounded-lg border border-coffee-beige/70 hover:bg-ivory-light transition-colors flex items-center justify-center shrink-0 ${
              collapsed ? 'w-9 h-9 bg-ivory-light' : 'w-7 h-7'
            }`}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-medium text-coffee-muted">
                Vận hành cơ bản
              </p>
            )}
            {basicNavItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={`relative flex items-center rounded-xl text-[13px] transition-all duration-200 ${
                    collapsed
                      ? 'justify-center py-2.5 px-0'
                      : 'gap-3 px-3 py-2.5'
                  } ${
                    isItemActive
                      ? 'text-ivory-light font-medium'
                      : 'text-coffee-dark/80 hover:bg-ivory/75 hover:text-coffee-dark font-normal'
                  }`}
                >
                  {isItemActive && (
                    <motion.span
                      layoutId="adminSidebarActivePill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 bg-coffee rounded-xl shadow-xs -z-0"
                    />
                  )}
                  <Icon className="relative z-10 w-[17px] h-[17px] shrink-0" />
                  {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                  {item.to === '/admin/feedback' && feedbackBadge.unreadCount > 0 && (
                    collapsed ? (
                      <span
                        className={`absolute top-1.5 right-3.5 z-10 w-2 h-2 rounded-full ${
                          feedbackBadge.hasLowRating ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                        }`}
                        aria-label={`${feedbackBadge.unreadCount} đánh giá mới`}
                      />
                    ) : (
                      <span
                        title={
                          feedbackBadge.hasLowRating
                            ? 'Có đánh giá mới (bao gồm 1–3 sao cần chú ý)'
                            : 'Đánh giá mới chưa xem'
                        }
                        className={`ml-auto relative z-10 px-1.5 min-w-[20px] h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                          feedbackBadge.hasLowRating
                            ? 'bg-red-600 text-white'
                            : isItemActive
                            ? 'bg-ivory-light text-coffee-dark'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {feedbackBadge.unreadCount > 99 ? '99+' : feedbackBadge.unreadCount}
                      </span>
                    )
                  )}
                </NavLink>
              );
            })}
          </div>

          {isOwnerAdmin && (
            <div className="space-y-1 pt-3 border-t border-coffee-beige/60">
              {!collapsed && (
                <p className="px-3 pb-1 text-[11px] font-medium text-coffee-muted flex items-center gap-1.5">
                  <span>Toàn quyền Admin</span>
                </p>
              )}
              {ownerNavItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center rounded-xl text-[13px] transition-all duration-200 ${
                      collapsed
                        ? 'justify-center py-2.5 px-0'
                        : 'gap-3 px-3 py-2.5'
                    } ${
                      isItemActive
                        ? 'text-ivory-light font-medium'
                        : 'text-coffee-dark/80 hover:bg-ivory/75 hover:text-coffee-dark font-normal'
                    }`}
                  >
                    {isItemActive && (
                      <motion.span
                        layoutId="adminSidebarActivePill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 bg-coffee rounded-xl shadow-xs -z-0"
                      />
                    )}
                    <Icon className="relative z-10 w-[17px] h-[17px] shrink-0" />
                    {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-coffee-beige/70 space-y-2 shrink-0 bg-ivory-light/50">
          {!collapsed && (
            <div className="p-2.5 rounded-xl bg-white border border-coffee-beige/70 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-coffee-dark truncate">
                  {profile?.full_name || user?.email || 'Admin Mode'}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
                    isOwnerAdmin
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-ivory text-coffee-dark border border-coffee-beige'
                  }`}
                >
                  {isOwnerAdmin ? (
                    <>
                      <span>Admin</span>
                    </>
                  ) : (
                    <span>Quản lý</span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-coffee-muted truncate">
                {user?.email || 'Local Setup Preview'}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Đăng xuất' : undefined}
            className={`w-full flex items-center text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors ${
              collapsed
                ? 'justify-center py-2.5 px-0'
                : 'justify-center lg:justify-start gap-2.5 px-3 py-2'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-coffee-dark/50 backdrop-blur-xs"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white text-coffee-dark flex flex-col h-full shadow-2xl border-r border-coffee-beige">
            <div className="h-16 px-4 border-b border-coffee-beige/70 flex items-center justify-between">
              <BrandLogo
                size="sm"
                subtitle="Admin CMS"
                textClassName="text-coffee-dark text-[15px]"
              />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-coffee-muted hover:text-coffee-dark hover:bg-ivory-light"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
              <div className="space-y-1">
                <p className="px-3 pb-1 text-[11px] font-medium text-coffee-muted">
                  Vận hành cơ bản
                </p>
                {basicNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                          isActive
                            ? 'bg-coffee text-ivory-light font-medium shadow-xs'
                            : 'text-coffee-dark/80 hover:bg-ivory/75 hover:text-coffee-dark'
                        }`
                      }
                    >
                      <Icon className="w-[17px] h-[17px] shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.to === '/admin/feedback' && feedbackBadge.unreadCount > 0 && (
                        <span
                          className={`px-1.5 min-w-[20px] h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                            feedbackBadge.hasLowRating
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {feedbackBadge.unreadCount > 99 ? '99+' : feedbackBadge.unreadCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {isOwnerAdmin && (
                <div className="space-y-1 pt-3 border-t border-coffee-beige/60">
                  <p className="px-3 pb-1 text-[11px] font-medium text-coffee-muted flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Toàn quyền Admin</span>
                  </p>
                  {ownerNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                            isActive
                              ? 'bg-coffee text-ivory-light font-medium shadow-xs'
                              : 'text-coffee-dark/80 hover:bg-ivory/75 hover:text-coffee-dark'
                          }`
                        }
                      >
                        <Icon className="w-[17px] h-[17px] shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </nav>

            <div className="p-4 border-t border-coffee-beige/70 bg-ivory-light/50">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-[268px]'
        }`}
      >
        <header className="h-16 bg-white border-b border-coffee-beige px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-coffee-dark border border-coffee-beige rounded-brand"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-coffee-muted truncate">
              <span>Admin CMS</span>
              <span>/</span>
              <span className="font-semibold text-coffee-dark truncate">
                {currentNav?.label || 'Quản trị hệ thống'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-ivory-light text-coffee border border-coffee-beige">
              <Clock className="w-3 h-3 text-coffee" />
              <span>Phiên hiện tại: {formatDurationVi(sessionElapsedSec)}</span>
            </div>

            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
                isConfigured && isLiveDatabase
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isConfigured && isLiveDatabase ? (
                <>
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>Đã kết nối Máy chủ</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Chưa kết nối Máy chủ</span>
                </>
              )}
            </div>

            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-ivory text-coffee-dark hover:bg-coffee-beige rounded-brand transition-colors"
            >
              <span>Xem Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isBlockedOwnerRoute ? (
            <div className="py-16 flex items-center justify-center">
              <div className="max-w-md w-full bg-white border border-coffee-beige rounded-brand p-8 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-coffee-dark">
                  Chỉ Dành Cho Admin
                </h2>
                <p className="text-sm text-coffee-muted leading-relaxed">
                  Tài khoản <strong>Quản lý</strong> chỉ được phép truy cập các chức năng vận hành cơ bản (Dashboard, Sản phẩm, Danh mục, Khuyến mãi, Thư viện ảnh & Media).
                </p>
                <p className="text-xs text-coffee-muted">
                  Mục <strong>"{currentNav?.label}"</strong> thuộc quyền quản trị hệ thống của <strong>Admin (Chủ quán)</strong>.
                </p>
                <div className="pt-2">
                  <Link
                    to="/admin/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors"
                  >
                    <span>Về Quản Lý Sản Phẩm</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="space-y-5 animate-pulse py-2">
                  <div className="h-8 w-64 bg-ivory rounded-brand" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-28 bg-white border border-ivory rounded-brand" />
                    ))}
                  </div>
                  <div className="h-64 bg-white border border-ivory rounded-brand" />
                </div>
              }
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ErrorBoundary fallbackTitle="Mục quản trị này gặp sự cố hiển thị">
                    <Outlet />
                  </ErrorBoundary>
                </motion.div>
              </AnimatePresence>
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
};
