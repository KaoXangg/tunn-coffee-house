import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const AdminResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (active && data.session) {
        setReady(true);
      }
    };
    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || Boolean(session)) {
        setReady(true);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Mật khẩu quá ngắn', 'Vui lòng nhập ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirm) {
      toast.error('Mật khẩu chưa khớp', 'Hai ô mật khẩu mới phải giống nhau.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error('Không thể cập nhật mật khẩu', error.message);
        return;
      }
      setDone(true);
      toast.success('Đã đặt lại mật khẩu thành công');
    } finally {
      setSaving(false);
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
              Đặt lại mật khẩu quản trị
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {done ? (
            <div className="text-center space-y-4 py-3">
              <CheckCircle2 className="w-11 h-11 text-emerald-700 mx-auto" />
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-medium text-coffee-dark">
                  Đã đổi mật khẩu mới
                </h2>
                <p className="text-xs text-coffee-muted leading-relaxed">
                  Bạn có thể vào thẳng trang quản trị ngay bây giờ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard', { replace: true })}
                className="w-full min-h-[44px] bg-coffee hover:bg-coffee-dark text-ivory-light text-sm font-medium rounded-xl transition-colors"
              >
                Vào trang Quản trị
              </button>
            </div>
          ) : !ready ? (
            <div className="space-y-4 text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-coffee mx-auto" />
              <p className="text-xs text-coffee-muted leading-relaxed">
                Đang xác thực liên kết khôi phục từ Email... Nếu liên kết đã hết hạn, vui lòng yêu cầu gửi lại từ trang đăng nhập.
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-coffee hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về trang đăng nhập</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-coffee-dark mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full min-h-[44px] pl-10 pr-10 py-2.5 text-sm bg-white border border-coffee-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee/25 focus:border-coffee"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-muted hover:text-coffee-dark"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-coffee-dark mb-1.5">
                  Nhập lại mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Nhập lại giống ô trên"
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm bg-white border border-coffee-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee/25 focus:border-coffee"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full min-h-[44px] bg-coffee hover:bg-coffee-dark text-ivory-light text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu mật khẩu mới</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
