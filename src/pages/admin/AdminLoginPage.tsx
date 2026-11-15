import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  Mail,
  ArrowLeft,
  Loader2,
  Database,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';

const loginSchema = z.object({
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LOCKOUT_KEY = 'tunn_login_lockout_until';
const ATTEMPTS_KEY = 'tunn_login_failed_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const AdminLoginPage: React.FC = () => {
  const { signInWithEmail, isConfigured } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  // Brute-force Rate-limit Lockout State
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  useEffect(() => {
    const checkLockout = () => {
      const until = Number(localStorage.getItem(LOCKOUT_KEY) || 0);
      const diff = Math.ceil((until - Date.now()) / 1000);
      if (diff > 0) {
        setLockoutRemainingSec(diff);
      } else {
        setLockoutRemainingSec(0);
      }
    };

    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    if (lockoutRemainingSec > 0) {
      toast.error(
        'Tạm khóa đăng nhập để bảo mật',
        `Vui lòng thử lại sau ${lockoutRemainingSec} giây.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signInWithEmail(values.email, values.password);
      if (error) {
        const currentAttempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
        localStorage.setItem(ATTEMPTS_KEY, String(currentAttempts));

        if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_MS;
          localStorage.setItem(LOCKOUT_KEY, String(until));
          localStorage.setItem(ATTEMPTS_KEY, '0');
          toast.error(
            'Đã khóa tạm thời 5 phút (Chống dò mật khẩu)',
            'Bạn đã nhập sai mật khẩu 5 lần liên tiếp.'
          );
        } else {
          toast.error(
            'Đăng nhập không thành công',
            `Sai thông tin đăng nhập (Còn ${
              MAX_FAILED_ATTEMPTS - currentAttempts
            } lần thử trước khi khóa tạm thời).`
          );
        }
      } else {
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_KEY);
        toast.success('Chào mừng trở lại!', 'Đã đăng nhập vào TUNN Admin CMS');
        navigate('/admin/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterPreviewMode = () => {
    sessionStorage.setItem('tunn_cms_preview_unlocked', 'true');
    toast.info('Chế độ xem trước CMS', 'Bạn đang trải nghiệm giao diện quản trị.');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#E9E6D8] text-[#241914] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block focus:outline-none">
          <BrandLogo
            size="xl"
            showText={false}
            className="mx-auto justify-center"
          />
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-[#241914]">
          TUNN Coffee House
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#8C7565] font-semibold">
          Hệ Thống Quản Trị Nội Dung (Admin CMS)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-xl py-8 px-6 sm:px-10">
          <div className="border-b border-[#D5C6AD] pb-3 mb-6 text-xs font-semibold uppercase tracking-wider text-[#241914] flex items-center justify-between">
            <span>Đăng nhập Quản trị viên</span>
            <Lock className="w-3.5 h-3.5 text-[#4B2E24]" />
          </div>

          {lockoutRemainingSec > 0 && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-brand text-xs text-red-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <strong>Chế độ bảo vệ chống dò mật khẩu đang bật:</strong> Vui lòng đợi{' '}
                <span className="font-bold">{lockoutRemainingSec} giây</span> trước khi thử đăng nhập lại.
              </div>
            </div>
          )}

          {/* Login Form (No Forgot Password link) */}
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Email Quản trị viên
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  autoComplete="email"
                  disabled={lockoutRemainingSec > 0}
                  {...loginForm.register('email')}
                  placeholder="admin@tunncoffee.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24] disabled:opacity-50"
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-xs text-red-700 mt-1">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoComplete="current-password"
                  disabled={lockoutRemainingSec > 0}
                  {...loginForm.register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24] disabled:opacity-50"
                />
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-xs text-red-700 mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || lockoutRemainingSec > 0}
              className="w-full mt-2 py-3 px-4 bg-[#4B2E24] hover:bg-[#241914] text-[#F7F5EF] text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {lockoutRemainingSec > 0
                  ? `Tạm khóa (${lockoutRemainingSec}s)`
                  : 'Đăng Nhập Hệ Thống'}
              </span>
            </button>
          </form>

          {!isConfigured && (
            <div className="mt-6 pt-6 border-t border-[#D5C6AD]">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-brand text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Chưa phát hiện biến môi trường Supabase (.env)</span>
                </div>
                <button
                  type="button"
                  onClick={handleEnterPreviewMode}
                  className="w-full py-2 px-3 bg-[#241914] text-[#F7F5EF] text-[11px] font-semibold uppercase tracking-wider rounded-brand hover:bg-[#4B2E24] transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mở Giao Diện Admin CMS (Chế độ Xem trước)</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#D5C6AD]/60 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C7565] hover:text-[#241914]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay về trang khách hàng TUNN Coffee House</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
