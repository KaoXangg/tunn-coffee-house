import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../common/BrandLogo';
import { formatDurationVi } from '../../lib/utils';
import { IDLE_TIMEOUT_STORAGE_KEY } from '../../pages/admin/AdminSecurityPage';

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

  // System, Brand & Security Pages (Accessible ONLY by Root Owner Admin)
  { label: 'Banner Đầu trang', to: '/admin/sections/hero', icon: Sparkles, ownerOnly: true },
  { label: 'Nội dung Trang chủ', to: '/admin/content', icon: FileText, ownerOnly: true },
  { label: 'Nhận diện Thương hiệu', to: '/admin/brand', icon: Award, ownerOnly: true },
  { label: 'Màu sắc & Giao diện', to: '/admin/settings/appearance', icon: Palette, ownerOnly: true },
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

  const prevPageRef = useRef<{ path: string; label: string; enteredAt: number } | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

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
    <div className="min-h-screen bg-[#F7F5EF] text-[#241914] flex">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#241914] text-[#F7F5EF] border-r border-[#4B2E24] transition-all duration-300 shrink-0 ${
          collapsed ? 'w-20' : 'w-68'
        }`}
      >
        <div className="h-16 px-4 border-b border-[#4B2E24] flex items-center justify-between gap-2">
          <Link to="/admin/dashboard" className="overflow-hidden">
            <BrandLogo
              size="sm"
              showText={!collapsed}
              subtitle="CMS STUDIO"
              textClassName="text-[#F7F5EF] text-base"
            />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 text-[#D5C6AD] hover:text-white rounded-brand hover:bg-[#4B2E24]/50 transition-colors"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2.5 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#D5C6AD]/50">
                Vận hành cơ bản
              </p>
            )}
            {basicNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-brand text-xs font-medium tracking-wide transition-colors ${
                      isActive
                        ? 'bg-[#4B2E24] text-[#F7F5EF] font-semibold shadow-sm'
                        : 'text-[#D5C6AD]/80 hover:bg-[#4B2E24]/40 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>

          {isOwnerAdmin && (
            <div className="space-y-1 pt-2 border-t border-[#4B2E24]/60">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-amber-300/80 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>Toàn quyền Admin Gốc</span>
                </p>
              )}
              {ownerNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-brand text-xs font-medium tracking-wide transition-colors ${
                        isActive
                          ? 'bg-[#4B2E24] text-[#F7F5EF] font-semibold shadow-sm'
                          : 'text-[#D5C6AD]/80 hover:bg-[#4B2E24]/40 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-[#4B2E24] space-y-2">
          {!collapsed && (
            <div className="px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                    isOwnerAdmin
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-[#4B2E24] text-[#D5C6AD]'
                  }`}
                >
                  {isOwnerAdmin ? (
                    <>
                      <Crown className="w-3 h-3" />
                      <span>Admin Gốc</span>
                    </>
                  ) : (
                    <span>Quản lý con (Cơ bản)</span>
                  )}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#F7F5EF] truncate">
                {profile?.full_name || user?.email || 'Admin Mode'}
              </p>
              <p className="text-[11px] text-[#D5C6AD]/70 truncate">
                {user?.email || 'Local Setup Preview'}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2 text-xs font-medium text-red-300 hover:text-red-200 hover:bg-red-950/40 rounded-brand transition-colors"
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
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-xs"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#241914] text-[#F7F5EF] flex flex-col h-full shadow-2xl">
            <div className="h-16 px-4 border-b border-[#4B2E24] flex items-center justify-between">
              <BrandLogo
                size="sm"
                subtitle="CMS STUDIO"
                textClassName="text-[#F7F5EF]"
              />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-[#D5C6AD] hover:text-white"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#D5C6AD]/50">
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
                        `flex items-center gap-3 px-3 py-2.5 rounded-brand text-xs font-medium ${
                          isActive
                            ? 'bg-[#4B2E24] text-[#F7F5EF] font-semibold'
                            : 'text-[#D5C6AD]/80 hover:bg-[#4B2E24]/40 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              {isOwnerAdmin && (
                <div className="space-y-1 pt-2 border-t border-[#4B2E24]/60">
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-amber-300/80 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>Toàn quyền Admin Gốc</span>
                  </p>
                  {ownerNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-brand text-xs font-medium ${
                            isActive
                              ? 'bg-[#4B2E24] text-[#F7F5EF] font-semibold'
                              : 'text-[#D5C6AD]/80 hover:bg-[#4B2E24]/40 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </nav>

            <div className="p-4 border-t border-[#4B2E24]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-300 hover:bg-red-950/40 rounded-brand"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#D5C6AD] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-[#241914] border border-[#D5C6AD] rounded-brand"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-[#8C7565] truncate">
              <span>Admin CMS</span>
              <span>/</span>
              <span className="font-semibold text-[#241914] truncate">
                {currentNav?.label || 'Quản trị hệ thống'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#F7F5EF] text-[#4B2E24] border border-[#D5C6AD]">
              <Clock className="w-3 h-3 text-[#4B2E24]" />
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand transition-colors"
            >
              <span>Xem Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isBlockedOwnerRoute ? (
            <div className="py-16 flex items-center justify-center">
              <div className="max-w-md w-full bg-white border border-[#D5C6AD] rounded-brand p-8 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[#241914]">
                  Chỉ Dành Cho Admin Gốc
                </h2>
                <p className="text-sm text-[#8C7565] leading-relaxed">
                  Tài khoản <strong>Quản lý con</strong> chỉ được phép truy cập các chức năng vận hành cơ bản (Dashboard, Sản phẩm, Danh mục, Khuyến mãi, Thư viện ảnh & Media).
                </p>
                <p className="text-xs text-[#8C7565]">
                  Mục <strong>"{currentNav?.label}"</strong> thuộc quyền quản trị hệ thống của <strong>Admin Gốc (Chủ quán)</strong>.
                </p>
                <div className="pt-2">
                  <Link
                    to="/admin/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors"
                  >
                    <span>Về Quản Lý Sản Phẩm</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};
