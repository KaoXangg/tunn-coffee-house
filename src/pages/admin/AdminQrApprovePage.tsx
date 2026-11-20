import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Monitor,
  ArrowLeft,
  AlertTriangle,
  Camera,
  Copy,
  Check,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { formatAccountIdentifier } from '../../lib/managerAuth';

interface QrInspectInfo {
  sessionId: string;
  codeChoices: string[];
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
        // Ignore JSON parse failure
      }
    }
  }
  return fallback;
}

function extractSessionIdFromQrText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    const sid = parsed.searchParams.get('sid');
    if (sid) return sid.trim();
  } catch {
    // Not a full URL; check if raw UUID
  }
  const uuidMatch = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  return uuidMatch ? uuidMatch[0] : '';
}

export const AdminQrApprovePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const sessionId = searchParams.get('sid') || '';

  const [inspectInfo, setInspectInfo] = useState<QrInspectInfo | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [loadingInspect, setLoadingInspect] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [decisionDone, setDecisionDone] = useState<'approved' | 'rejected' | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Built-in Camera QR Scanner State (used when opened inside logged-in Admin without ?sid=)
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleScannedText = useCallback(
    (rawText: string) => {
      const sid = extractSessionIdFromQrText(rawText);
      if (!sid) return false;
      stopCamera();
      setInspectInfo(null);
      setInspectError(null);
      setDecisionDone(null);
      setSearchParams({ sid }, { replace: true });
      return true;
    },
    [setSearchParams, stopCamera]
  );

  // Start built-in camera automatically when user is logged in and no ?sid= is in URL
  useEffect(() => {
    if (authLoading || !user || sessionId) {
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Trình duyệt này không hỗ trợ mở camera trực tiếp.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const scanFrame = () => {
          if (cancelled) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w > 0 && h > 0) {
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);
                const imgData = ctx.getImageData(0, 0, w, h);
                const code = jsQR(imgData.data, w, h, {
                  inversionAttempts: 'dontInvert',
                });
                if (code?.data && handleScannedText(code.data)) {
                  return;
                }
              }
            }
          }
          rafRef.current = window.requestAnimationFrame(scanFrame);
        };
        rafRef.current = window.requestAnimationFrame(scanFrame);
      } catch {
        if (!cancelled) {
          setCameraError(
            'Không thể mở camera. Bạn có thể cấp quyền camera hoặc dán đường dẫn QR vào ô bên dưới.'
          );
        }
      }
    };

    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [authLoading, user, sessionId, stopCamera, handleScannedText]);

  const preconditionError = !isSupabaseConfigured
    ? 'Chưa kết nối hệ thống Supabase.'
    : null;

  useEffect(() => {
    if (authLoading || preconditionError || !user || !sessionId) {
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
        if (error || data?.error || !Array.isArray(data?.codeChoices) || data.codeChoices.length === 0) {
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
    (Boolean(user) &&
      Boolean(sessionId) &&
      !preconditionError &&
      (loadingInspect || (!inspectInfo && !inspectError)));

  const handleSelectNumber = async (selectedCode: string) => {
    if (!sessionId) return;
    setSubmitting(selectedCode);
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        status?: string;
        error?: string;
      }>('qr-login', {
        body: { action: 'approve', sessionId, selectedCode },
      });

      if (error || data?.error || !data?.ok) {
        const msg =
          data?.error ||
          (await extractFunctionErrorMessage(
            error,
            'Số xác nhận không khớp hoặc mã QR đã hết hạn.'
          ));
        setInspectError(msg);
        toast.error('Không thể đăng nhập', msg);
        return;
      }

      setDecisionDone('approved');
      toast.success('Đã xác nhận đăng nhập', 'Máy tính đang tự động vào trang quản trị.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    if (!sessionId) return;
    setSubmitting('reject');
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        status?: string;
        error?: string;
      }>('qr-login', {
        body: { action: 'reject', sessionId },
      });

      if (error || data?.error || !data?.ok) {
        const msg =
          data?.error ||
          (await extractFunctionErrorMessage(error, 'Mã QR có thể đã hết hạn.'));
        toast.error('Không thể xử lý yêu cầu', msg);
        return;
      }

      setDecisionDone('rejected');
      toast.info('Đã từ chối yêu cầu đăng nhập');
    } finally {
      setSubmitting(null);
    }
  };

  const redirectBackUrl = sessionId
    ? `/admin/qr-approve?sid=${encodeURIComponent(sessionId)}`
    : '/admin/qr-approve';

  const handleCopyApproveLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success('Đã sao chép đường dẫn', 'Mở trình duyệt đã đăng nhập Admin rồi dán để duyệt.');
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

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
                  <strong className="block mb-1">Trình duyệt này chưa đăng nhập Admin</strong>
                  <span>
                    Nếu bạn vừa quét bằng Zalo hoặc Camera, ứng dụng có thể đang mở bằng trình duyệt phụ. Hãy đăng nhập ngay tại đây, hoặc sao chép đường dẫn này mở bằng trình duyệt Chrome/Safari đã đăng nhập sẵn.
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
                Đăng nhập ngay tại đây
              </button>

              {sessionId && (
                <button
                  type="button"
                  onClick={() => void handleCopyApproveLink()}
                  className="w-full min-h-[42px] px-4 border border-coffee-beige bg-white hover:bg-ivory text-coffee-dark text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedLink ? 'Đã sao chép đường dẫn' : 'Sao chép đường dẫn duyệt'}</span>
                </button>
              )}
            </div>
          ) : !sessionId ? (
            <div className="space-y-4">
              <p className="text-xs text-coffee-muted leading-relaxed">
                Đưa camera vào mã QR đang hiện trên màn hình máy tính để xác nhận đăng nhập nhanh mà không bị lỗi trình duyệt phụ.
              </p>

              <div className="relative rounded-2xl overflow-hidden bg-coffee-dark aspect-square max-h-72 mx-auto flex items-center justify-center border border-coffee-beige">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraActive && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-ivory-light/85 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Đang bật camera...</span>
                  </div>
                )}
                {cameraActive && (
                  <div className="absolute inset-8 border-2 border-ivory-light/75 rounded-xl pointer-events-none" />
                )}
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                  <Camera className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <span>{cameraError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!handleScannedText(manualInput)) {
                    toast.error('Đường dẫn không hợp lệ', 'Vui lòng dán đúng link từ mã QR.');
                  }
                }}
                className="space-y-2 pt-2 border-t border-coffee-beige/70"
              >
                <label className="block text-[11px] font-medium text-coffee-muted">
                  Hoặc dán đường dẫn từ mã QR nếu không dùng camera:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="https://.../admin/qr-approve?sid=..."
                    className="flex-1 min-h-[40px] px-3 text-xs bg-white border border-coffee-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee/25"
                  />
                  <button
                    type="submit"
                    className="px-3.5 min-h-[40px] bg-coffee text-ivory-light text-xs font-medium rounded-xl hover:bg-coffee-dark transition-colors"
                  >
                    Mở
                  </button>
                </div>
              </form>

              <Link
                to="/admin/dashboard"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs text-coffee-muted hover:text-coffee-dark"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về trang Quản trị</span>
              </Link>
            </div>
          ) : effectiveError ? (
            <div className="space-y-4 text-center py-4">
              <XCircle className="w-10 h-10 text-red-700 mx-auto" />
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-medium text-coffee-dark">
                  Không thể xác thực mã QR
                </h2>
                <p className="text-xs text-coffee-muted leading-relaxed">
                  {effectiveError}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setInspectInfo(null);
                    setInspectError(null);
                    setSearchParams({}, { replace: true });
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-coffee text-ivory-light text-xs font-medium hover:bg-coffee-dark transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Quét lại mã khác</span>
                </button>
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-coffee-beige text-xs font-medium text-coffee-dark hover:bg-ivory transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Về trang quản trị</span>
                </Link>
              </div>
            </div>
          ) : decisionDone ? (
            <div className="space-y-4 text-center py-4">
              {decisionDone === 'approved' ? (
                <>
                  <CheckCircle2 className="w-11 h-11 text-emerald-700 mx-auto" />
                  <div className="space-y-1">
                    <h2 className="font-serif text-xl font-medium text-coffee-dark">
                      Đã cho phép đăng nhập
                    </h2>
                    <p className="text-xs text-coffee-muted leading-relaxed">
                      Máy tính sẽ tự động vào trang quản trị trong vài giây. Bạn có thể đóng màn hình này.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-11 h-11 text-coffee-muted mx-auto" />
                  <div className="space-y-1">
                    <h2 className="font-serif text-xl font-medium text-coffee-dark">
                      Đã từ chối yêu cầu
                    </h2>
                    <p className="text-xs text-coffee-muted leading-relaxed">
                      Phiên đăng nhập trên máy tính kia đã bị hủy an toàn.
                    </p>
                  </div>
                </>
              )}
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-coffee text-ivory-light text-xs font-medium hover:bg-coffee-dark transition-colors"
              >
                <span>Về trang Quản trị</span>
              </Link>
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
                <div className="flex items-center gap-2.5 text-xs text-coffee-muted">
                  <ShieldCheck className="w-4 h-4 text-coffee shrink-0" />
                  <span>
                    Tài khoản duyệt:{' '}
                    <strong className="text-coffee-dark">
                      {formatAccountIdentifier(inspectInfo.approverEmail).label}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-medium text-coffee-dark text-center leading-relaxed">
                  Chạm chọn đúng <strong className="text-coffee">số đang hiện trên màn hình máy tính</strong> để xác nhận đăng nhập:
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {inspectInfo.codeChoices.map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={Boolean(submitting)}
                      onClick={() => void handleSelectNumber(num)}
                      className="min-h-[56px] rounded-xl border-2 border-coffee-beige bg-white hover:border-coffee hover:bg-ivory text-coffee-dark font-serif text-2xl font-semibold tabular-nums transition-all active:scale-[0.97] flex items-center justify-center disabled:opacity-50"
                    >
                      {submitting === num ? (
                        <Loader2 className="w-5 h-5 animate-spin text-coffee" />
                      ) : (
                        num
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-coffee-muted text-center">
                  Nếu chọn sai số, mã QR sẽ bị hủy ngay để tránh kẻ xấu đoán mò.
                </p>
              </div>

              <button
                type="button"
                disabled={Boolean(submitting)}
                onClick={() => void handleReject()}
                className="w-full min-h-[42px] px-4 rounded-xl border border-coffee-beige bg-white hover:bg-red-50 hover:border-red-200 text-coffee-muted hover:text-red-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting === 'reject' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Không phải tôi — Từ chối ngay</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
