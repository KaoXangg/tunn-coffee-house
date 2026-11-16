import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
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
  const { signInWithEmail, signOut, isConfigured } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

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
      const { error } = await signInWithEmail(values.email, values.password);
      if (error) {
        if (error === 'ACCOUNT_LOCKED') {
          setAccountLockedMessage(
            'Tài khoản quản lý này đã bị khóa bởi Admin Gốc (Chủ quán). Vui lòng liên hệ Chủ quán để được mở khóa.'
          );
          toast.error(
            'Tài khoản đã bị khóa',
            'Tài khoản của bạn hiện đang bị khóa quyền truy cập bởi Admin Gốc.'
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

        // Check if 2FA (TOTP MFA) is required for this account
        if (isSupabaseConfigured) {
          const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const verifiedTotp = factors?.totp.find((f) => f.status === 'verified');
            if (verifiedTotp) {
              setMfaFactorId(verifiedTotp.id);
              setMfaCode('');
              toast.info('Yêu cầu Xác thực 2 lớp (2FA)', 'Vui lòng nhập mã 6 chữ số từ ứng dụng Authenticator.');
              return;
            }
          }
        }

        toast.success('Chào mừng trở lại!', 'Đã đăng nhập vào TUNN Admin CMS');
        navigate('/admin/dashboard');
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
      navigate('/admin/dashboard');
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
    <div className="min-h-screen w-full bg-[#FAF8F4] text-[#1C1410] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Full-Bleed Brand Showcase */}
      <aside className="relative lg:col-span-6 xl:col-span-7 bg-[#160F0C] text-[#F7F5EF] p-8 sm:p-12 xl:p-16 flex flex-col justify-between overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(#E9E6D8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-[#6B4232]/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-[360px] h-[360px] rounded-full bg-[#A67C52]/15 blur-3xl"
        />

        {/* Top Brand & Live Status */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-3.5 group focus:outline-none"
          >
            <BrandLogo
              size="md"
              showText={false}
              className="ring-1 ring-[#D5C6AD]/30 rounded-full"
            />
            <div>
              <p className="font-serif text-lg font-semibold tracking-wide text-[#F7F5EF] group-hover:text-[#D5C6AD] transition-colors">
                TUNN Coffee House
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#D5C6AD]/70">
                CMS Studio v2.0
              </p>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-[#E9E6D8]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hệ thống sẵn sàng</span>
          </span>
        </div>

        {/* Center Editorial Statement */}
        <div className="relative z-10 my-10 lg:my-0 max-w-xl space-y-5">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-[#D4A574] font-semibold">
            <span>Workspace Quản Trị</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl xl:text-[2.75rem] font-normal leading-[1.16] tracking-tight text-[#FAF8F4]">
            Kiểm soát mọi điểm chạm thương hiệu trên một nền tảng tinh gọn.
          </h1>
          <p className="text-sm sm:text-base text-[#D5C6AD]/80 leading-relaxed max-w-lg">
            Quản lý thực đơn, chương trình ưu đãi, giao diện theo mùa và phản hồi khách hàng tại bàn theo thời gian thực.
          </p>
        </div>

        {/* Bottom Architecture Pillars */}
        <div className="relative z-10 hidden lg:grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4A574] font-semibold">
              01 · Đồng bộ tức thì
            </p>
            <p className="text-xs font-medium text-[#F7F5EF] mt-1.5">
              Thực đơn &amp; Bố cục
            </p>
            <p className="text-[11px] text-[#D5C6AD]/65 mt-1 leading-relaxed">
              Xuất bản thay đổi trực tiếp tới trang khách hàng không cần tải lại.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4A574] font-semibold">
              02 · Bảo mật đa lớp
            </p>
            <p className="text-xs font-medium text-[#F7F5EF] mt-1.5">
              2FA &amp; Phân quyền
            </p>
            <p className="text-[11px] text-[#D5C6AD]/65 mt-1 leading-relaxed">
              Xác thực OTP, khóa brute-force và nhật ký thao tác chi tiết.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4A574] font-semibold">
              03 · Trải nghiệm QR
            </p>
            <p className="text-xs font-medium text-[#F7F5EF] mt-1.5">
              Đánh giá &amp; Thống kê
            </p>
            <p className="text-[11px] text-[#D5C6AD]/65 mt-1 leading-relaxed">
              Theo dõi lượt quét bàn và phản hồi xác thực từ khách ghé quán.
            </p>
          </div>
        </div>
      </aside>

      {/* Right Clean Auth Workspace */}
      <main className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 xl:p-16 bg-[#FAF8F4]">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A6558] hover:text-[#1C1410] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về trang khách hàng</span>
          </Link>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7565] font-semibold">
            Admin Access
          </span>
        </div>

        <div className="w-full max-w-[400px] mx-auto my-10">
          <div className="mb-8">
            <div className="w-11 h-11 rounded-2xl bg-[#EFECE3] border border-[#DDD3C2] flex items-center justify-center mb-5">
              {mfaFactorId ? (
                <Smartphone className="w-5 h-5 text-[#4B2E24]" />
              ) : (
                <Lock className="w-5 h-5 text-[#4B2E24]" />
              )}
            </div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#1C1410]">
              {mfaFactorId ? 'Xác thực 2 lớp' : 'Chào mừng trở lại'}
            </h2>
            <p className="text-sm text-[#7A6558] mt-1.5">
              {mfaFactorId
                ? 'Nhập mã OTP 6 chữ số từ ứng dụng Authenticator để tiếp tục.'
                : 'Đăng nhập bằng tài khoản Quản trị viên để vào TUNN CMS.'}
            </p>
          </div>

          {lockoutRemainingSec > 0 && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <strong>Chế độ bảo vệ chống dò mật khẩu đang bật:</strong> Vui lòng đợi{' '}
                <span className="font-bold">{lockoutRemainingSec} giây</span> trước khi thử đăng nhập lại.
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
              <div>
                <label className="block text-xs font-semibold text-[#1C1410] mb-1.5">
                  Mã OTP 6 chữ số
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full h-12 px-4 text-xl font-mono tracking-[0.45em] text-center bg-white border border-[#DDD3C2] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#4B2E24]/10 focus:border-[#241914] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={verifyingMfa || mfaCode.length < 6}
                className="w-full h-11 px-4 bg-[#241914] hover:bg-[#3A251C] text-[#FAF8F4] text-xs font-semibold uppercase tracking-[0.16em] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {verifyingMfa && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác Nhận &amp; Vào Quản Trị</span>
                {!verifyingMfa && <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCancelMfa}
                className="w-full py-2 text-xs font-medium text-[#7A6558] hover:text-[#1C1410] transition-colors"
              >
                Hủy &amp; Đăng nhập tài khoản khác
              </button>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1410] mb-1.5">
                  Email quản trị
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    disabled={lockoutRemainingSec > 0}
                    {...loginForm.register('email')}
                    placeholder="admin@tunncoffee.com"
                    className="w-full h-11 pl-10 pr-3.5 text-sm bg-white border border-[#DDD3C2] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#4B2E24]/10 focus:border-[#241914] transition-all disabled:opacity-50"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-700 mt-1.5">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1410] mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={lockoutRemainingSec > 0}
                    {...loginForm.register('password')}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 text-sm bg-white border border-[#DDD3C2] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#4B2E24]/10 focus:border-[#241914] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C7565] hover:text-[#1C1410] transition-colors"
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
                  <p className="text-xs text-red-700 mt-1.5">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || lockoutRemainingSec > 0}
                className="w-full h-11 mt-2 px-4 bg-[#241914] hover:bg-[#3A251C] text-[#FAF8F4] text-xs font-semibold uppercase tracking-[0.16em] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {lockoutRemainingSec > 0
                    ? `Tạm khóa (${lockoutRemainingSec}s)`
                    : 'Đăng Nhập Hệ Thống'}
                </span>
                {!submitting && lockoutRemainingSec === 0 && (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </form>
          )}

          {!isConfigured && (
            <div className="mt-6 pt-6 border-t border-[#DDD3C2]">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Chưa phát hiện biến môi trường Supabase (.env)</span>
                </div>
                <button
                  type="button"
                  onClick={handleEnterPreviewMode}
                  className="w-full py-2 px-3 bg-[#241914] text-[#FAF8F4] text-[11px] font-semibold uppercase tracking-wider rounded-xl hover:bg-[#4B2E24] transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mở Giao Diện Admin CMS (Chế độ Xem trước)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#8C7565] pt-4 border-t border-[#E6DFD1]">
          <span>© 2026 TUNN Coffee House</span>
          <span>Bảo vệ bởi 2FA &amp; Supabase Auth</span>
        </div>
      </main>
    </div>
  );
};
