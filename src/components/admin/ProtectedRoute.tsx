import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin, loading, isConfigured, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F5EF] text-[#241914]">
        <Loader2 className="w-8 h-8 text-[#4B2E24] animate-spin mb-3" />
        <p className="font-serif text-lg text-[#4B2E24]">
          Đang xác thực phiên quản trị TUNN CMS...
        </p>
      </div>
    );
  }

  // If Supabase is configured, strictly require authenticated Admin user
  if (isConfigured && !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If user is logged in on Supabase but does not have 'admin' role in profiles
  if (isConfigured && user && profile && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5EF] p-6">
        <div className="max-w-md w-full bg-white border border-[#D5C6AD] rounded-brand p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-800 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#241914]">
            Không Đủ Quyền Truy Cập
          </h2>
          <p className="text-sm text-[#8C7565] mt-2 leading-relaxed">
            Tài khoản <strong>{user.email}</strong> hiện đang có vai trò{' '}
            <code className="px-1.5 py-0.5 bg-[#E9E6D8] text-[#241914] rounded">
              {profile.role}
            </code>
            . Chỉ tài khoản có vai trò <code className="font-semibold">admin</code> mới được phép chỉnh sửa nội dung hệ thống.
          </p>
          <div className="mt-6 p-3.5 bg-[#E9E6D8]/50 border border-[#D5C6AD] rounded-brand text-left text-xs text-[#241914] space-y-1">
            <p className="font-semibold">Cách cấp quyền Admin trên Supabase:</p>
            <p className="font-mono text-[11px] bg-white p-2 rounded border border-[#D5C6AD]">
              UPDATE public.profiles SET role = &apos;admin&apos; WHERE email = &apos;{user.email}&apos;;
            </p>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold border border-[#D5C6AD] text-[#241914] rounded-brand hover:bg-[#E9E6D8]"
            >
              Về trang chủ
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-[#4B2E24] text-[#F7F5EF] rounded-brand hover:bg-[#241914]"
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
