import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Smartphone,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ShieldOff,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface EnrolledFactor {
  id: string;
  friendly_name?: string;
  status: string;
}

export const AdminMfaCard: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [verifiedFactor, setVerifiedFactor] = useState<EnrolledFactor | null>(null);

  // Enrollment flow state
  const [enrolling, setEnrolling] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const loadFactors = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verified = data.totp.find((f) => f.status === 'verified') || null;
        setVerifiedFactor(verified);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      return;
    }
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (!error && data) {
        const verified = data.totp.find((f) => f.status === 'verified') || null;
        setVerifiedFactor(verified);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleStartEnroll = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Cần kết nối Supabase Auth để sử dụng Xác thực 2 lớp (2FA).');
      return;
    }
    setEnrolling(true);
    try {
      // Clean up any unverified stale factors first
      const { data: existing } = await supabase.auth.mfa.listFactors();
      if (existing?.totp) {
        for (const f of existing.totp) {
          if (f.status !== 'verified') {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'TUNN Admin Authenticator',
      });

      if (error || !data) {
        toast.error(error?.message || 'Không thể khởi tạo mã QR 2FA.');
        return;
      }

      setPendingFactorId(data.id);
      setQrCodeSvg(data.totp.qr_code);
      setSecretKey(data.totp.secret);
      setOtpCode('');
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFactorId || otpCode.trim().length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số từ ứng dụng Authenticator.');
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: pendingFactorId,
        code: otpCode.trim(),
      });

      if (error) {
        toast.error('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
        return;
      }

      toast.success('Đã kích hoạt Xác thực 2 lớp (2FA) thành công!');
      setPendingFactorId(null);
      setQrCodeSvg(null);
      setSecretKey(null);
      setOtpCode('');
      await loadFactors();
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!verifiedFactor) return;
    setDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Đã tắt Xác thực 2 lớp (2FA).');
      setVerifiedFactor(null);
    } finally {
      setDisabling(false);
    }
  };

  const handleCopySecret = () => {
    if (!secretKey || !navigator.clipboard) return;
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 1800);
  };

  return (
    <div className="bg-white border border-coffee-beige rounded-brand p-6 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-coffee-beige">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-5 h-5 text-coffee" />
          <div>
            <h2 className="font-serif text-xl font-semibold text-coffee-dark">
              Xác Thực 2 Lớp (2FA — Google / Microsoft Authenticator)
            </h2>
            <p className="text-xs text-coffee-muted">
              Bảo vệ tài khoản Admin bằng mã OTP 6 chữ số mỗi lần đăng nhập
            </p>
          </div>
        </div>

        {!loading && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              verifiedFactor
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {verifiedFactor ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã bật 2FA</span>
              </>
            ) : (
              <span>Chưa bật 2FA</span>
            )}
          </span>
        )}
      </div>

      {!isSupabaseConfigured ? (
        <p className="text-sm text-coffee-muted">
          Tính năng 2FA yêu cầu kết nối Supabase Auth trực tiếp.
        </p>
      ) : loading ? (
        <div className="py-4 flex items-center gap-2 text-xs text-coffee-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang kiểm tra trạng thái 2FA...</span>
        </div>
      ) : verifiedFactor ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-brand">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-950">
              Tài khoản của bạn đang được bảo vệ bởi Authenticator (TOTP)
            </p>
            <p className="text-xs text-emerald-800">
              Tên thiết bị: {verifiedFactor.friendly_name || 'TUNN Admin Authenticator'}
            </p>
          </div>
          <button
            type="button"
            disabled={disabling}
            onClick={handleDisable2FA}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-red-300 bg-white text-red-700 hover:bg-red-50 rounded-brand shrink-0 disabled:opacity-50"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            <span>{disabling ? 'Đang tắt...' : 'Tắt 2FA'}</span>
          </button>
        </div>
      ) : qrCodeSvg ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-4 bg-ivory-light border border-coffee-beige rounded-brand">
          <div className="md:col-span-5 flex flex-col items-center gap-2">
            <div className="p-3 bg-white border border-coffee-beige rounded-brand">
              <img
                src={qrCodeSvg}
                alt="QR Code 2FA Authenticator"
                className="w-44 h-44 object-contain"
              />
            </div>
            {secretKey && (
              <button
                type="button"
                onClick={handleCopySecret}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-coffee hover:underline"
              >
                {copiedSecret ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Sao chép mã khóa thủ công</span>
              </button>
            )}
          </div>

          <form onSubmit={handleVerifyEnroll} className="md:col-span-7 space-y-4">
            <div className="text-xs text-coffee space-y-1 leading-relaxed">
              <p>
                <strong>Bước 1:</strong> Mở ứng dụng <strong>Google Authenticator</strong> hoặc{' '}
                <strong>Microsoft Authenticator</strong> trên điện thoại và quét mã QR bên cạnh.
              </p>
              <p>
                <strong>Bước 2:</strong> Nhập mã 6 chữ số hiển thị trên ứng dụng để xác nhận kích hoạt.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Mã OTP 6 chữ số *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full max-w-xs px-4 py-2.5 text-base font-mono tracking-[0.35em] text-center bg-white border border-coffee-beige rounded-brand"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={verifying || otpCode.length < 6}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{verifying ? 'Đang xác nhận...' : 'Xác nhận & Bật 2FA'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingFactorId(null);
                  setQrCodeSvg(null);
                  setSecretKey(null);
                }}
                className="px-4 py-2 text-xs text-coffee-muted hover:text-coffee-dark"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-coffee-muted leading-relaxed max-w-2xl">
            Khi bật 2FA, ngay cả khi ai đó biết được mật khẩu của bạn, họ vẫn không thể đăng nhập vào trang quản trị nếu không có mã xác thực 6 chữ số trên điện thoại của bạn.
          </p>
          <button
            type="button"
            disabled={enrolling}
            onClick={handleStartEnroll}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand shrink-0 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{enrolling ? 'Đang tạo mã QR...' : 'Bật Xác Thực 2 Lớp'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
