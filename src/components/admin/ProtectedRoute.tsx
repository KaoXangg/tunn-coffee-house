import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin, loading, isConfigured, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ivory-light text-coffee-dark">
        <Loader2 className="w-8 h-8 text-coffee animate-spin mb-3" />
        <p className="font-serif text-lg text-coffee">
          Đang xác thực phiên quản trị TUNN CMS...
        </p>
      </div>
    );
  }

  // If Supabase is configured, strictly require authenticated Admin user
  if (isConfigured && !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If user is logged in on Supabase but account is locked (not 'admin')
  if (isConfigured && user && profile && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-light p-6">
        <div className="max-w-md w-full bg-white border border-coffee-beige rounded-brand p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-800 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-coffee-dark">
            Tài Khoản Đã Bị Khóa
          </h2>
          <p className="text-sm text-coffee-muted mt-3 leading-relaxed">
            Tài khoản <strong>{user.email}</strong> hiện đã bị tạm khóa quyền truy cập hệ thống quản trị bởi <strong>Admin Gốc (Chủ quán)</strong>.
          </p>
          <p className="text-xs text-coffee-muted mt-2">
            Vui lòng liên hệ trực tiếp với Chủ quán nếu bạn cần mở khóa lại tài khoản.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold border border-coffee-beige text-coffee-dark rounded-brand hover:bg-ivory"
            >
              Về trang chủ
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light rounded-brand hover:bg-coffee-dark"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Supabase is not configured yet, require user to go through login or explicit local setup preview
  if (!isConfigured && !sessionStorage.getItem('tunn_cms_preview_unlocked')) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
