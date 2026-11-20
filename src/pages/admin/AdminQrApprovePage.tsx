import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Monitor,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';

interface QrInspectInfo {
  sessionId: string;
  verificationCode: string;
  deviceLabel: string;
  expiresAt: string;
  approverEmail: string;
}

async function extractFunctionErrorMessage(
  error: unknown,
  fallback: string
): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      try {
        const json = (await ctx.clone().json()) as { error?: string };
        if (json?.error) return json.error;
      } catch {
        // Ignore JSON parse failure on non-JSON error responses
      }
    }
  }
  return fallback;
}

export const AdminQrApprovePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const sessionId = searchParams.get('sid') || '';

  const [inspectInfo, setInspectInfo] = useState<QrInspectInfo | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [loadingInspect, setLoadingInspect] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);
  const [decisionDone, setDecisionDone] = useState<'approved' | 'rejected' | null>(null);

  const preconditionError = !sessionId
    ? 'Đường dẫn mã QR không hợp lệ.'
    : !isSupabaseConfigured
    ? 'Chưa kết nối hệ thống Supabase.'
    : null;

  useEffect(() => {
    if (authLoading || preconditionError || !user) {
      return;
    }

    let cancelled = false;
    const inspectSession = async () => {
      setLoadingInspect(true);
      setInspectError(null);
      try {
        const { data, error } = await supabase.functions.invoke<
          QrInspectInfo & { error?: string }
        >('qr-login', {
          body: { action: 'inspect', sessionId },
        });
        if (cancelled) return;
        if (error || data?.error || !data?.verificationCode) {
          const msg =
            data?.error ||
            (await extractFunctionErrorMessage(
              error,
              'Mã QR đã hết hạn hoặc không còn hiệu lực.'
            ));
          if (!cancelled) {
            setInspectError(msg);
          }
          return;
        }
        setInspectInfo(data);
      } catch {
        if (!cancelled) {
          setInspectError('Không thể kết nối máy chủ để kiểm tra mã QR.');
        }
      } finally {
        if (!cancelled) setLoadingInspect(false);
      }
    };

    const timer = window.setTimeout(() => {
      void inspectSession();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authLoading, preconditionError, sessionId, user]);

  const effectiveError = preconditionError || inspectError;
  const isChecking =
    authLoading ||
    (Boolean(user) && !preconditionError && (loadingInspect || (!inspectInfo && !inspectError)));

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (!sessionId) return;
    setSubmitting(decision);
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        status?: string;
        error?: string;
      }>('qr-login', {
        body: { action: decision, sessionId },
      });

      if (error || data?.error || !data?.ok) {
        const msg =
          data?.error ||
          (await extractFunctionErrorMessage(
            error,
            'Mã QR có thể đã hết hạn.'
          ));
        toast.error('Không thể xử lý yêu cầu', msg);
        return;
      }

      if (decision === 'approve') {
        setDecisionDone('approved');
        toast.success('Đã cho phép đăng nhập', 'Thiết bị kia sẽ tự động vào trang quản trị.');
      } else {
        setDecisionDone('rejected');
        toast.info('Đã từ chối yêu cầu đăng nhập');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const redirectBackUrl = `/admin/qr-approve?sid=${encodeURIComponent(sessionId)}`;

  return (
    <div className="min-h-screen w-full bg-ivory text-coffee-dark font-sans flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-ivory-light border border-coffee-beige rounded-2xl shadow-editorial-lg overflow-hidden">
        <div className="bg-coffee-dark text-ivory-light px-6 py-4 flex items-center gap-3">
          <BrandLogo size="md" showText={false} />
          <div>
            <h1 className="font-serif text-lg font-medium leading-tight">
              TUNN Coffee House
            </h1>
            <p className="text-xs text-coffee-beige/85">
              Xác nhận đăng nhập bằng mã QR
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {isChecking ? (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-2.5 text-coffee-muted">
              <Loader2 className="w-6 h-6 animate-spin text-coffee" />
              <p className="text-sm">Đang kiểm tra phiên đăng nhập...</p>
            </div>
          ) : !user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-1">Thiết bị này chưa đăng nhập Admin</strong>
                  <span>
                    Để duyệt đăng nhập cho máy tính qua mã QR, điện thoại này phải đang đăng nhập sẵn tài khoản quản trị.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/login?redirect=${encodeURIComponent(redirectBackUrl)}`)
                }
                className="w-full min-h-[44px] px-4 bg-coffee hover:bg-coffee-dark text-ivory-light text-sm font-medium rounded-xl transition-colors"
              >
                Đăng nhập trên thiết bị này
              </button>
            </div>
          ) : effectiveError ? (
            <div className="space-y-4 text-center py-4">
              <XCircle className="w-10 h-10 text-red-700 mx-auto" />
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-medium text-coffee-dark">
                  Mã QR không còn hiệu lực
                </h2>
                <p className="text-xs text-coffee-muted leading-relaxed">
                  {effectiveError}
                </p>
              </div>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 border border-coffee-beige text-coffee-dark hover:bg-ivory text-xs font-medium rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về trang Quản trị</span>
              </Link>
            </div>
          ) : decisionDone === 'approved' ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="w-11 h-11 text-emerald-700 mx-auto" />
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-medium text-coffee-dark">
                  Đã cho phép đăng nhập
                </h2>
                <p className="text-xs text-coffee-muted leading-relaxed">
                  Trình duyệt trên máy tính đang tự động mở trang Quản trị CMS. Bạn có thể đóng trang này.
                </p>
              </div>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center justify-center w-full min-h-[44px] px-4 bg-coffee text-ivory-light text-xs font-medium rounded-xl hover:bg-coffee-dark transition-colors"
              >
                Mở trang Quản trị
              </Link>
            </div>
          ) : decisionDone === 'rejected' ? (
            <div className="space-y-4 text-center py-4">
              <XCircle className="w-11 h-11 text-coffee-muted mx-auto" />
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-medium text-coffee-dark">
                  Đã từ chối yêu cầu
                </h2>
                <p className="text-xs text-coffee-muted">
                  Phiên mã QR vừa rồi đã bị hủy ngay lập tức.
                </p>
              </div>
            </div>
          ) : inspectInfo ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-white border border-coffee-beige space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-coffee-muted">
                  <Monitor className="w-4 h-4 text-coffee shrink-0" />
                  <span>
                    Thiết bị yêu cầu:{' '}
                    <strong className="text-coffee-dark">{inspectInfo.deviceLabel}</strong>
                  </span>
                </div>

                <div className="pt-3 border-t border-coffee-beige/60 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-coffee-muted">Số đối chiếu trên màn hình kia</p>
                    <p className="text-[11px] text-coffee-muted mt-0.5">
                      Chỉ bấm Cho phép nếu 2 số này trùng khớp
                    </p>
                  </div>
                  <span className="font-serif text-3xl font-bold text-coffee bg-ivory px-4 py-1.5 rounded-xl border border-coffee-beige tabular-nums">
                    {inspectInfo.verificationCode}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-coffee-muted">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Duyệt bằng tài khoản:{' '}
                  <strong className="text-coffee-dark">{inspectInfo.approverEmail}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={submitting !== null}
                  onClick={() => handleDecision('reject')}
                  className="min-h-[44px] px-4 rounded-xl border border-coffee-beige bg-white text-coffee-dark hover:bg-ivory text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting === 'reject' ? 'Đang hủy...' : 'Từ chối'}
                </button>
                <button
                  type="button"
                  disabled={submitting !== null}
                  onClick={() => handleDecision('approve')}
                  className="min-h-[44px] px-4 rounded-xl bg-coffee hover:bg-coffee-dark text-ivory-light text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting === 'approve' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cho phép đăng nhập</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
