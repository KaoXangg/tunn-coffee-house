import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  Smartphone,
  Eye,
  EyeOff,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { renderQrToDataUrl } from '../../lib/qrGenerator';
import {
  isValidIdentifierOrEmail,
  normalizeLoginIdentifier,
} from '../../lib/managerAuth';

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

  // QR Login & Recovery State
  const [qrMode, setQrMode] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<'qr' | 'email'>('qr');
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrSession, setQrSession] = useState<{
    sessionId: string;
    sessionSecret: string;
    verificationCode: string;
    expiresAt: string;
  } | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(0);

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
          setQrMode(false);
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

  const startQrSession = useCallback(async () => {
    if (!isConfigured) {
      setQrError('Chưa kết nối Supabase để sử dụng đăng nhập bằng mã QR.');
      return;
    }
    setQrLoading(true);
    setQrError(null);
    setQrSession(null);
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const browserLabel = ua.includes('Edg')
        ? 'Edge'
        : ua.includes('Chrome')
        ? 'Chrome'
        : ua.includes('Safari')
        ? 'Safari'
        : ua.includes('Firefox')
        ? 'Firefox'
        : 'Trình duyệt';
      const osLabel = /iPhone|iPad/i.test(ua)
        ? 'iOS'
        : /Android/i.test(ua)
        ? 'Android'
        : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac/i.test(ua)
        ? 'macOS'
        : 'Web';

      const { data, error } = await supabase.functions.invoke<{
        sessionId?: string;
        sessionSecret?: string;
        verificationCode?: string;
        expiresAt?: string;
        error?: string;
      }>('qr-login', {
        body: {
          action: 'create',
          deviceLabel: `${browserLabel} · ${osLabel}`,
        },
      });

      if (error || data?.error || !data?.sessionId || !data?.sessionSecret || !data?.verificationCode || !data?.expiresAt) {
        setQrError(
          data?.error ||
            'Không thể khởi tạo mã QR. Hãy kiểm tra Edge Function qr-login đã được triển khai.'
        );
        return;
      }

      setQrSession({
        sessionId: data.sessionId,
        sessionSecret: data.sessionSecret,
        verificationCode: data.verificationCode,
        expiresAt: data.expiresAt,
      });
      setQrSecondsLeft(
        Math.max(0, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
      );
    } catch {
      setQrError('Mất kết nối máy chủ khi tạo mã QR.');
    } finally {
      setQrLoading(false);
    }
  }, [isConfigured]);

  const qrDataUrl = useMemo(() => {
    if (!qrSession || typeof window === 'undefined') return '';
    const approveUrl = `${window.location.origin}/admin/qr-approve?sid=${encodeURIComponent(
      qrSession.sessionId
    )}`;
    return renderQrToDataUrl(approveUrl, {
      pixelSize: 320,
      marginModules: 2,
      darkColor: '#241914',
      lightColor: '#FFFFFF',
    });
  }, [qrSession]);

  useEffect(() => {
    if (!qrMode || !qrSession) {
      return;
    }

    const updateRemaining = () => {
      const diff = Math.max(
        0,
        Math.ceil((new Date(qrSession.expiresAt).getTime() - Date.now()) / 1000)
      );
      setQrSecondsLeft(diff);
    };
    const initialTimer = window.setTimeout(updateRemaining, 0);
    const countdownTimer = window.setInterval(updateRemaining, 1000);

    let stopped = false;
    const pollTimer = window.setInterval(async () => {
      if (stopped) return;
      try {
        const { data } = await supabase.functions.invoke<{
          status?: string;
          email?: string;
          otpToken?: string;
        }>('qr-login', {
          body: {
            action: 'poll',
            sessionId: qrSession.sessionId,
            sessionSecret: qrSession.sessionSecret,
          },
        });

        if (stopped || !data) return;

        if (data.status === 'expired') {
          stopped = true;
          setQrSecondsLeft(0);
          setQrError('Mã QR đã hết hạn. Vui lòng tạo mã mới.');
          return;
        }

        if (data.status === 'rejected') {
          stopped = true;
          setQrSession(null);
          setQrError('Yêu cầu đăng nhập đã bị từ chối trên thiết bị kia.');
          return;
        }

        if (data.status === 'approved' && data.email && data.otpToken) {
          stopped = true;
          const { error: otpErr } = await supabase.auth.verifyOtp({
            email: data.email,
            token: data.otpToken,
            type: 'email',
          });
          if (otpErr) {
            setQrError('Không thể xác thực phiên đăng nhập từ mã QR.');
            return;
          }
          localStorage.removeItem(ATTEMPTS_KEY);
          localStorage.removeItem(LOCKOUT_KEY);
          await completeLoginNavigation();
        }
      } catch {
        // Silent retry on next poll tick
      }
    }, 2500);

    return () => {
      stopped = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(countdownTimer);
      window.clearInterval(pollTimer);
    };
  }, [qrMode, qrSession, completeLoginNavigation]);

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
      const loginEmail = normalizeLoginIdentifier(values.email);
      const { error } = await signInWithEmail(loginEmail, values.password);
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
                  : qrMode
                  ? 'Đăng nhập bằng mã QR'
                  : lockoutRemainingSec > 0 || accountLockedMessage
                  ? 'Tạm khóa truy cập'
                  : 'Đăng nhập quản trị'}
              </h2>
              {mfaFactorId ? (
                <Smartphone className="w-5 h-5 text-coffee shrink-0" />
              ) : qrMode ? (
                <QrCode className="w-5 h-5 text-coffee shrink-0" />
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
            ) : qrMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-ivory rounded-xl border border-coffee-beige">
                  <button
                    type="button"
                    onClick={() => setRecoveryTab('qr')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                      recoveryTab === 'qr'
                        ? 'bg-coffee text-ivory-light shadow-xs'
                        : 'text-coffee-muted hover:text-coffee-dark'
                    }`}
                  >
                    Quét mã QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryTab('email')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                      recoveryTab === 'email'
                        ? 'bg-coffee text-ivory-light shadow-xs'
                        : 'text-coffee-muted hover:text-coffee-dark'
                    }`}
                  >
                    Khôi phục Email
                  </button>
                </div>

                {recoveryTab === 'qr' ? (
                  <>
                    <p className="text-xs text-coffee-muted leading-relaxed">
                      Trên điện thoại đang đăng nhập sẵn, mở mục <strong className="text-coffee-dark">Quét QR Đăng nhập</strong> trong menu Admin (hoặc quét bằng Camera), rồi <strong className="text-coffee-dark">chọn đúng số khớp với màn hình này</strong>.
                    </p>

                    <div className="p-4 sm:p-5 bg-white border border-coffee-beige rounded-2xl flex flex-col items-center text-center gap-3">
                      {qrLoading ? (
                        <div className="w-44 h-44 flex flex-col items-center justify-center gap-2 text-coffee-muted">
                          <Loader2 className="w-6 h-6 animate-spin text-coffee" />
                          <span className="text-xs">Đang tạo mã QR...</span>
                        </div>
                      ) : qrError ? (
                        <div className="py-6 px-3 space-y-3">
                          <p className="text-xs text-red-700 font-medium leading-relaxed">
                            {qrError}
                          </p>
                          <button
                            type="button"
                            onClick={() => void startQrSession()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coffee text-ivory-light text-xs font-medium hover:bg-coffee-dark transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Tạo mã QR mới</span>
                          </button>
                        </div>
                      ) : qrSession && qrDataUrl ? (
                        <>
                          <div className="p-2 bg-white border border-coffee-beige/80 rounded-xl">
                            <img
                              src={qrDataUrl}
                              alt="Mã QR đăng nhập Admin"
                              className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                            />
                          </div>

                          <div className="w-full pt-2 border-t border-coffee-beige/60 flex items-center justify-between gap-2 text-xs">
                            <span className="text-coffee-muted">
                              Số xác nhận:{' '}
                              <strong className="font-serif text-lg text-coffee font-bold tabular-nums">
                                {qrSession.verificationCode}
                              </strong>
                            </span>
                            {qrSecondsLeft > 0 ? (
                              <span className="text-coffee-muted tabular-nums">
                                Hết hạn sau{' '}
                                <strong className="text-coffee-dark">{qrSecondsLeft}s</strong>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void startQrSession()}
                                className="inline-flex items-center gap-1 font-semibold text-coffee hover:underline"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Làm mới mã</span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {resetSent ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 leading-relaxed">
                        <strong className="block text-sm">Đã gửi liên kết đặt lại mật khẩu</strong>
                        <p>
                          Vui lòng kiểm tra hộp thư <strong>{resetEmail}</strong> (kể cả mục Thư rác) và bấm vào liên kết để đặt mật khẩu mới.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const trimmed = resetEmail.trim().toLowerCase();
                          if (!trimmed || !trimmed.includes('@')) {
                            toast.error('Vui lòng nhập địa chỉ Gmail / Email hợp lệ');
                            return;
                          }
                          setSendingReset(true);
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
                              redirectTo: `${window.location.origin}/admin/reset-password`,
                            });
                            if (error) {
                              toast.error('Không thể gửi email khôi phục', error.message);
                              return;
                            }
                            setResetSent(true);
                          } finally {
                            setSendingReset(false);
                          }
                        }}
                        className="space-y-3"
                      >
                        <p className="text-xs text-coffee-muted leading-relaxed">
                          Nếu bạn là <strong className="text-coffee-dark">Chủ quán / Quản lý dùng Gmail</strong> và không có thiết bị nào đăng nhập sẵn, nhập Gmail để nhận liên kết đặt lại mật khẩu:
                        </p>
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="admin@gmail.com"
                          className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-coffee-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee/25 focus:border-coffee"
                        />
                        <button
                          type="submit"
                          disabled={sendingReset}
                          className="w-full min-h-[42px] bg-coffee hover:bg-coffee-dark text-ivory-light text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {sendingReset && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Gửi liên kết đặt lại mật khẩu</span>
                        </button>
                      </form>
                    )}

                    <div className="p-3.5 rounded-xl bg-ivory border border-coffee-beige text-[11px] text-coffee-muted leading-relaxed">
                      <strong className="text-coffee-dark block mb-0.5">
                        Quản lý dùng Tên đăng nhập (như quanly1)?
                      </strong>
                      Nếu quên mật khẩu và không có máy nào đang đăng nhập sẵn, hãy báo Chủ quán vào mục{' '}
                      <strong className="text-coffee-dark">Bảo mật &amp; Tài khoản → Cấp lại mật khẩu</strong>.
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setQrMode(false);
                    setQrSession(null);
                    setQrError(null);
                    setResetSent(false);
                  }}
                  className="w-full min-h-[42px] py-2 text-xs font-medium text-coffee-muted hover:text-coffee-dark transition-colors"
                >
                  Quay lại đăng nhập bằng mật khẩu
                </button>
              </div>
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
                    <Mail className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-login-email"
                      type="text"
                      autoComplete="username"
                      disabled={lockoutRemainingSec > 0}
                      {...loginForm.register('email')}
                      placeholder="quanly1 hoặc admin@tunncoffee.com"
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

                {isConfigured && (
                  <button
                    type="button"
                    disabled={lockoutRemainingSec > 0}
                    onClick={() => {
                      setQrMode(true);
                      void startQrSession();
                    }}
                    className="w-full min-h-[42px] px-4 border border-coffee-beige bg-white hover:bg-ivory text-coffee-dark text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4 text-coffee" />
                    <span>Quên mật khẩu? Đăng nhập bằng mã QR</span>
                  </button>
                )}
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
