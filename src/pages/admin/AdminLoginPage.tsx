import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  User,
  ArrowLeft,
  Loader2,
  Database,
  CheckCircle2,
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { isValidIdentifierOrEmail } from '../../lib/managerAuth';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .refine(
      (val) => isValidIdentifierOrEmail(val),
      'Vui lòng nhập Email hoặc Tên đăng nhập hợp lệ'
    ),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LOCKOUT_KEY = 'tunn_login_lockout_until';
const ATTEMPTS_KEY = 'tunn_login_failed_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const AdminLoginPage: React.FC = () => {
  const { signInWithEmail, signOut, isConfigured } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const postLoginPath = useMemo(() => {
    const raw = searchParams.get('redirect') || '';
    if (raw.startsWith('/admin')) return raw;
    return '/admin/dashboard';
  }, [searchParams]);

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountLockedMessage, setAccountLockedMessage] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [verifyingMfa, setVerifyingMfa] = useState(false);

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

  const completeLoginNavigation = useCallback(async () => {
    if (isSupabaseConfigured) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verifiedTotp = factors?.totp.find((f) => f.status === 'verified');
        if (verifiedTotp) {
          setMfaFactorId(verifiedTotp.id);
          setMfaCode('');
          toast.info(
            'Yêu cầu Xác thực 2 lớp (2FA)',
            'Vui lòng nhập mã 6 chữ số từ ứng dụng Authenticator.'
          );
          return;
        }
      }
    }

    toast.success('Chào mừng trở lại!', 'Đã đăng nhập vào TUNN Admin CMS');
    navigate(postLoginPath);
  }, [navigate, postLoginPath, toast]);

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
    setAccountLockedMessage(null);
    try {
      const { error } = await signInWithEmail(values.email.trim(), values.password);
      if (error) {
        if (error === 'ACCOUNT_LOCKED') {
          setAccountLockedMessage(
            'Tài khoản quản lý này đã bị khóa bởi Admin (Chủ quán). Vui lòng liên hệ Chủ quán để được mở khóa.'
          );
          toast.error(
            'Tài khoản đã bị khóa',
            'Tài khoản của bạn hiện đang bị khóa quyền truy cập bởi Admin.'
          );
          return;
        }

        // Server-side Auth Hook lockout message (from handle_password_verification_attempt)
        if (error.toLowerCase().includes('khóa tạm thời')) {
          const secMatch = error.match(/(\d+)\s*giây/);
          if (secMatch) {
            const sec = Number(secMatch[1]);
            if (Number.isFinite(sec) && sec > 0) {
              localStorage.setItem(LOCKOUT_KEY, String(Date.now() + sec * 1000));
              localStorage.setItem(ATTEMPTS_KEY, '0');
            }
          }
          toast.error('Tài khoản đang bị khóa tạm thời', error);
          return;
        }

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

        await completeLoginNavigation();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId || mfaCode.trim().length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    setVerifyingMfa(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaCode.trim(),
      });
      if (error) {
        toast.error('Mã OTP không đúng hoặc đã hết hạn.');
        return;
      }
      toast.success('Xác thực 2 lớp thành công!', 'Đã đăng nhập vào TUNN Admin CMS');
      navigate(postLoginPath);
    } finally {
      setVerifyingMfa(false);
    }
  };

  const handleCancelMfa = async () => {
    setMfaFactorId(null);
    setMfaCode('');
    await signOut();
  };

  const handleEnterPreviewMode = () => {
    sessionStorage.setItem('tunn_cms_preview_unlocked', 'true');
    toast.info('Chế độ xem trước CMS', 'Bạn đang trải nghiệm giao diện quản trị.');
    navigate('/admin/dashboard');
  };

  return (
    <div
      className="min-h-screen w-full bg-ivory text-coffee-dark font-sans flex items-center justify-center p-4 sm:p-6 lg:p-10"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 90% 60% at 50% 0%, var(--color-bg-primary, #F7F5EF), transparent 75%)',
      }}
    >
      <div className="w-full max-w-[880px] bg-ivory-light border border-coffee-beige rounded-2xl shadow-editorial-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Mobile/Tablet Top Coffee Band (< 1024px) */}
        <div className="lg:hidden bg-coffee-dark text-ivory-light px-6 py-5 flex items-center gap-3.5">
          <div className="shrink-0">
            <BrandLogo size="lg" showText={false} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-medium leading-tight text-ivory-light">
              TUNN Coffee House
            </h1>
            <p className="text-xs text-coffee-beige/90 mt-0.5">
              Quản trị cửa hàng
            </p>
          </div>
        </div>

        {/* Left Espresso Brand Panel (Desktop >= 1024px) */}
        <aside
          className="hidden lg:flex lg:col-span-5 bg-coffee-dark text-ivory-light p-10 flex-col justify-between relative overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 15%, rgba(213, 198, 173, 0.14), transparent 55%), radial-gradient(circle at 85% 90%, rgba(75, 46, 36, 0.65), transparent 60%)',
          }}
        >
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center py-4">
            <BrandLogo size="2xl" showText={false} />

            <h1 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-ivory-light mt-6 whitespace-nowrap">
              TUNN Coffee House
            </h1>
            <div className="w-10 h-px bg-coffee-beige/40 my-3.5" aria-hidden="true" />
            <p className="text-sm text-coffee-beige/90">
              Quản trị cửa hàng
            </p>
          </div>

          <div className="relative z-10 pt-5 border-t border-coffee-beige/20 text-center">
            <p className="text-xs text-coffee-beige/75">
              Khu vực nội bộ dành cho quản trị viên
            </p>
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="lg:col-span-7 p-6 sm:p-10 lg:p-11 flex flex-col justify-between bg-ivory-light">
          <div>
            <div className="pb-4 mb-6 border-b border-coffee-beige flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl font-medium text-coffee-dark">
                {mfaFactorId
                  ? 'Xác thực 2 lớp (2FA)'
                  : lockoutRemainingSec > 0 || accountLockedMessage
                  ? 'Tạm khóa truy cập'
                  : 'Đăng nhập quản trị'}
              </h2>
              {mfaFactorId ? (
                <Smartphone className="w-5 h-5 text-coffee shrink-0" />
              ) : lockoutRemainingSec > 0 || accountLockedMessage ? (
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0" />
              ) : null}
            </div>

            {lockoutRemainingSec > 0 && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">
                    Chế độ bảo vệ chống dò mật khẩu đang bật:
                  </strong>
                  <span>
                    Vui lòng đợi <span className="font-bold">{lockoutRemainingSec} giây</span> trước khi thử đăng nhập lại.
                  </span>
                </div>
              </div>
            )}

            {accountLockedMessage && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Tài Khoản Đã Bị Khóa</strong>
                  <span>{accountLockedMessage}</span>
                </div>
              </div>
            )}

            {/* Login Form or 2FA Step */}
            {mfaFactorId ? (
              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div className="p-3.5 bg-ivory/70 border border-coffee-beige rounded-xl text-xs text-coffee-dark flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-coffee shrink-0 mt-0.5" />
                  <span>
                    Mở ứng dụng Authenticator trên điện thoại và nhập mã 6 chữ số để hoàn tất đăng nhập.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="admin-login-mfa-otp"
                    className="block text-[13px] font-medium text-coffee-dark mb-1.5"
                  >
                    Mã OTP 6 chữ số
                  </label>
                  <input
                    id="admin-login-mfa-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full min-h-[48px] px-4 text-lg font-mono tracking-[0.4em] text-center bg-white text-coffee-dark border border-coffee-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee/25 focus:border-coffee transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingMfa || mfaCode.length < 6}
                  className="w-full min-h-[44px] px-4 bg-coffee hover:bg-coffee-dark text-ivory-light text-sm font-medium rounded-xl shadow-editorial transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {verifyingMfa && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Xác nhận</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelMfa}
                  className="w-full min-h-[44px] py-2 text-xs font-medium text-coffee-muted hover:text-coffee-dark transition-colors"
                >
                  Hủy và đăng nhập tài khoản khác
                </button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-login-email"
                    className="block text-[13px] font-medium text-coffee-dark mb-1.5"
                  >
                    Email hoặc tên đăng nhập
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-login-email"
                      type="text"
                      autoComplete="username"
                      disabled={lockoutRemainingSec > 0}
                      {...loginForm.register('email')}
                      placeholder="Nhập email hoặc tên đăng nhập"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm bg-white text-coffee-dark placeholder:text-coffee-muted/70 border border-coffee-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee/25 focus:border-coffee transition-all disabled:opacity-50"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-700 mt-1.5 font-medium">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="admin-login-password"
                    className="block text-[13px] font-medium text-coffee-dark mb-1.5"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      disabled={lockoutRemainingSec > 0}
                      {...loginForm.register('password')}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-white text-coffee-dark placeholder:text-coffee-muted/70 border border-coffee-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee/25 focus:border-coffee transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-coffee-muted hover:text-coffee-dark transition-colors"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-700 mt-1.5 font-medium">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || lockoutRemainingSec > 0}
                  className="w-full min-h-[44px] mt-2 px-4 bg-coffee hover:bg-coffee-dark text-ivory-light text-sm font-medium rounded-xl shadow-editorial transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {lockoutRemainingSec > 0
                      ? `Tạm khóa (${lockoutRemainingSec}s)`
                      : 'Đăng nhập'}
                  </span>
                </button>
              </form>
            )}

            {!isConfigured && (
              <div className="mt-6 pt-5 border-t border-coffee-beige">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Database className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Chưa phát hiện biến môi trường Supabase (.env)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnterPreviewMode}
                    className="w-full min-h-[44px] py-2 px-3 bg-coffee-dark text-ivory-light text-xs font-medium rounded-xl hover:bg-coffee transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mở chế độ xem trước CMS</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-coffee-beige/60">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-coffee-muted hover:text-coffee-dark transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay về trang khách hàng</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};
