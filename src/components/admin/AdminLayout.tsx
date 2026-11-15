import React, { useState } from 'react';
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Database,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { BrandLogo } from '../common/BrandLogo';

interface NavGroupItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CMS_NAV_ITEMS: NavGroupItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Sản phẩm (Products)', to: '/admin/products', icon: Coffee },
  { label: 'Danh mục (Categories)', to: '/admin/categories', icon: FolderTree },
  { label: 'Thư viện Media', to: '/admin/media', icon: ImageIcon },
  { label: 'Hero Editor', to: '/admin/sections/hero', icon: Sparkles },
  { label: 'Nội dung Website', to: '/admin/content', icon: FileText },
  { label: 'Khuyến mãi (Promotions)', to: '/admin/promotions', icon: Megaphone },
  { label: 'Thư viện Ảnh (Gallery)', to: '/admin/gallery', icon: GalleryHorizontalEnd },
  { label: 'Thương hiệu (Brand)', to: '/admin/brand', icon: Award },
  { label: 'Giao diện (Appearance)', to: '/admin/settings/appearance', icon: Palette },
  { label: 'Liên hệ (Contact)', to: '/admin/settings/contact', icon: PhoneCall },
  { label: 'Cấu hình SEO', to: '/admin/settings/seo', icon: Globe },
];

export const AdminLayout: React.FC = () => {
  const { user, profile, signOut, isConfigured } = useAuth();
  const { isLiveDatabase } = useSiteData();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const currentNav = CMS_NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.to)
  );

  const handleLogout = async () => {
    sessionStorage.removeItem('tunn_cms_preview_unlocked');
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#241914] flex">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#241914] text-[#F7F5EF] border-r border-[#4B2E24] transition-all duration-300 shrink-0 ${
          collapsed ? 'w-20' : 'w-68'
        }`}
      >
        {/* Brand Header */}
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

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          {CMS_NAV_ITEMS.map((item) => {
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
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-[#4B2E24] space-y-2">
          {!collapsed && (
            <div className="px-2 py-1.5">
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

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {CMS_NAV_ITEMS.map((item) => {
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
        {/* Top Bar with Breadcrumb & Status */}
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
            {/* Database Connection Badge */}
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
                  <span>Supabase Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Chưa kết nối .env Supabase</span>
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

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
