import React, { useState } from 'react';
import { Clock, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import { AdminMfaCard } from '../../../components/admin/AdminMfaCard';
import { PasswordStrengthMeter } from '../../../components/admin/PasswordStrengthMeter';

interface AccountSecuritySectionProps {
  userEmail?: string | null;
  newPassword: string;
  confirmPassword: string;
  updatingPassword: boolean;
  idleMinutes: number;
  fullName: string;
  username: string;
  updatingProfile: boolean;
  onChangeNewPassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  onPasswordChange: (e: React.FormEvent) => void;
  onSaveIdleTimeout: (minutes: number) => void;
  onChangeFullName: (v: string) => void;
  onChangeUsername: (v: string) => void;
  onProfileSave: (e: React.FormEvent) => void;
}

export const AccountSecuritySection: React.FC<AccountSecuritySectionProps> = ({
  userEmail,
  newPassword,
  confirmPassword,
  updatingPassword,
  idleMinutes,
  fullName,
  username,
  updatingProfile,
  onChangeNewPassword: setNewPassword,
  onChangeConfirmPassword: setConfirmPassword,
  onPasswordChange: handlePasswordChange,
  onSaveIdleTimeout: handleSaveIdleTimeout,
  onChangeFullName: setFullName,
  onChangeUsername: setUsername,
  onProfileSave: handleProfileSave,
}) => {
  const user = userEmail ? { email: userEmail } : null;
  const [showNewPw, setShowNewPw] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6">
          {/* Personal Password Card */}
          <form
            onSubmit={handlePasswordChange}
            className="bg-white border border-coffee-beige rounded-brand p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-coffee-beige">
              <KeyRound className="w-5 h-5 text-coffee" />
              <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                Đổi Mật Khẩu Cá Nhân Của Bạn
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-muted mb-1">
                Tài khoản đang đăng nhập
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-sm bg-ivory/60 border border-coffee-beige rounded-brand text-coffee-dark font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Mật khẩu mới (Tối thiểu 12 ký tự, chuẩn OWASP) *
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="VD: Tunn@Coffee2026!"
                  className="w-full px-3.5 py-2 pr-10 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-coffee-muted hover:text-coffee-dark"
                  aria-label={showNewPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter
                password={newPassword}
                email={user?.email}
                showCopy
                onGenerate={(generated) => {
                  setNewPassword(generated);
                  setConfirmPassword(generated);
                  setShowNewPw(true);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Nhập lại mật khẩu mới *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới..."
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword || !newPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand disabled:opacity-50"
            >
              {updatingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Lưu Mật Khẩu Mới</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-6">
          {/* Auto Session Timeout Card */}
          <div className="bg-white border border-coffee-beige rounded-brand p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-coffee-beige">
              <Clock className="w-5 h-5 text-coffee" />
              <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                Tự Động Khóa Phiên Khi Không Hoạt Động
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { label: '15 phút', val: 15 },
                { label: '30 phút', val: 30 },
                { label: '60 phút', val: 60 },
                { label: 'Không khóa', val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleSaveIdleTimeout(opt.val)}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-brand border transition-colors ${
                    idleMinutes === opt.val
                      ? 'bg-coffee text-ivory-light border-coffee'
                      : 'bg-ivory-light text-coffee-dark border-coffee-beige hover:bg-ivory'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleProfileSave}
              className="pt-4 border-t border-coffee-beige space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                    Tên hiển thị của bạn
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                    Tên đăng nhập (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin (mặc định) hoặc tên riêng"
                    className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-coffee-muted">
                  Mặc định Chủ quán đăng nhập được bằng <code className="font-mono">admin</code>, hoặc đặt tên riêng (3-32 ký tự) ở đây.
                </p>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-ivory text-coffee-dark hover:bg-coffee-beige rounded-brand shrink-0"
                >
                  {updatingProfile ? 'Đang lưu...' : 'Lưu Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION 4: TWO-FACTOR AUTHENTICATION (2FA / MFA FOR OWNER) */}
      <AdminMfaCard />
    </>
  );
};
