import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  Mail,
  UserPlus,
  KeyRound,
  ArrowLeft,
  Loader2,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';

const loginSchema = z.object({
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ tên'),
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
});

const resetSchema = z.object({
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export const AdminLoginPage: React.FC = () => {
  const { signInWithEmail, signUpFirstAdmin, sendPasswordReset, isConfigured } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [submitting, setSubmitting] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const { error } = await signInWithEmail(values.email, values.password);
      if (error) {
        toast.error('Đăng nhập không thành công', error);
      } else {
        toast.success('Chào mừng trở lại!', 'Đã đăng nhập vào TUNN Admin CMS');
        navigate('/admin/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      const { error, message } = await signUpFirstAdmin(
        values.email,
        values.password,
        values.fullName
      );
      if (error) {
        toast.error('Không thể khởi tạo tài khoản', error);
      } else {
        toast.success('Khởi tạo thành công', message);
        navigate('/admin/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResetSubmit = async (values: ResetFormValues) => {
    setSubmitting(true);
    try {
      const { error } = await sendPasswordReset(values.email);
      if (error) {
        toast.error('Gửi yêu cầu thất bại', error);
      } else {
        toast.success(
          'Đã gửi email khôi phục',
          'Vui lòng kiểm tra hộp thư đến của bạn để đặt lại mật khẩu.'
        );
        setMode('login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterPreviewMode = () => {
    sessionStorage.setItem('tunn_cms_preview_unlocked', 'true');
    toast.info(
      'Chế độ xem trước CMS',
      'Bạn đang trải nghiệm giao diện quản trị. Hãy kết nối biến môi trường Supabase để lưu dữ liệu vĩnh viễn.'
    );
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
          {/* Mode Switch Tabs */}
          <div className="flex border-b border-[#D5C6AD] mb-6 text-xs font-semibold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 pb-3 border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-[#4B2E24] text-[#241914]'
                  : 'border-transparent text-[#8C7565] hover:text-[#241914]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 pb-3 border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-[#4B2E24] text-[#241914]'
                  : 'border-transparent text-[#8C7565] hover:text-[#241914]'
              }`}
            >
              Tạo Admin đầu tiên
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
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
                    {...loginForm.register('email')}
                    placeholder="admin@tunncoffee.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-700 mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914]">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-xs text-[#4B2E24] hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    {...loginForm.register('password')}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
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
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 bg-[#4B2E24] hover:bg-[#241914] text-[#F7F5EF] text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Đăng Nhập Hệ Thống</span>
              </button>
            </form>
          )}

          {/* Register First Admin Form */}
          {mode === 'register' && (
            <form
              onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
              className="space-y-4"
            >
              <div className="p-3 bg-[#E9E6D8]/60 border border-[#D5C6AD] rounded-brand text-xs text-[#241914] leading-relaxed">
                <strong>Cơ chế bảo mật:</strong> Tài khoản đầu tiên đăng ký trên Supabase Database sẽ tự động được gán quyền <code className="font-semibold">admin</code> thông qua PostgreSQL Trigger. Các tài khoản đăng ký sau mặc định là <code className="font-semibold">staff</code>.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Họ và Tên
                </label>
                <input
                  type="text"
                  {...registerForm.register('fullName')}
                  placeholder="Chủ quán TUNN Coffee"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="text-xs text-red-700 mt-1">
                    {registerForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Email Quản trị
                </label>
                <input
                  type="email"
                  {...registerForm.register('email')}
                  placeholder="owner@tunncoffee.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-red-700 mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Mật khẩu (Tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  {...registerForm.register('password')}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-red-700 mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-[#4B2E24] hover:bg-[#241914] text-[#F7F5EF] text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Khởi Tạo Tài Khoản Admin</span>
              </button>
            </form>
          )}

          {/* Password Reset Form */}
          {mode === 'reset' && (
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <p className="text-xs text-[#8C7565] leading-relaxed">
                Nhập địa chỉ email quản trị viên của bạn. Hệ thống Supabase Auth sẽ gửi đường dẫn đặt lại mật khẩu mới.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Email của bạn
                </label>
                <input
                  type="email"
                  {...resetForm.register('email')}
                  placeholder="admin@tunncoffee.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
                />
                {resetForm.formState.errors.email && (
                  <p className="text-xs text-red-700 mt-1">
                    {resetForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-[#4B2E24] hover:bg-[#241914] text-[#F7F5EF] text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>Gửi Email Khôi Phục</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-[#8C7565] hover:text-[#241914] pt-2"
              >
                Quay lại Đăng nhập
              </button>
            </form>
          )}

          {/* Setup Helper Notice when .env is not yet configured */}
          {!isConfigured && (
            <div className="mt-6 pt-6 border-t border-[#D5C6AD]">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-brand text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Chưa phát hiện biến môi trường Supabase (.env)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Để bật xác thực Supabase Auth & lưu trữ PostgreSQL trực tuyến, hãy tạo file <code className="font-mono bg-amber-100 px-1 rounded">.env</code> từ <code className="font-mono bg-amber-100 px-1 rounded">.env.example</code>. Bạn cũng có thể mở giao diện quản trị ở chế độ xem trước ngay bây giờ:
                </p>
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
