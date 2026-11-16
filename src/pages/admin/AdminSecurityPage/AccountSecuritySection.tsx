import React from 'react';
import { Clock, KeyRound, Loader2, Lock } from 'lucide-react';
import { AdminMfaCard } from '../../../components/admin/AdminMfaCard';

interface AccountSecuritySectionProps {
  userEmail?: string | null;
  newPassword: string;
  confirmPassword: string;
  updatingPassword: boolean;
  idleMinutes: number;
  fullName: string;
  updatingProfile: boolean;
  onChangeNewPassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  onPasswordChange: (e: React.FormEvent) => void;
  onSaveIdleTimeout: (minutes: number) => void;
  onChangeFullName: (v: string) => void;
  onProfileSave: (e: React.FormEvent) => void;
}

export const AccountSecuritySection: React.FC<AccountSecuritySectionProps> = ({
  userEmail,
  newPassword,
  confirmPassword,
  updatingPassword,
  idleMinutes,
  fullName,
  updatingProfile,
  onChangeNewPassword: setNewPassword,
  onChangeConfirmPassword: setConfirmPassword,
  onPasswordChange: handlePasswordChange,
  onSaveIdleTimeout: handleSaveIdleTimeout,
  onChangeFullName: setFullName,
  onProfileSave: handleProfileSave,
}) => {
  const user = userEmail ? { email: userEmail } : null;
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6">
          {/* Personal Password Card */}
          <form
            onSubmit={handlePasswordChange}
            className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#D5C6AD]">
              <KeyRound className="w-5 h-5 text-[#4B2E24]" />
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Đổi Mật Khẩu Cá Nhân Của Bạn
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C7565] mb-1">
                Tài khoản đang đăng nhập
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-sm bg-[#E9E6D8]/60 border border-[#D5C6AD] rounded-brand text-[#241914] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Mật khẩu mới (Tối thiểu 6 ký tự) *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Nhập lại mật khẩu mới *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới..."
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword || !newPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand disabled:opacity-50"
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
          <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#D5C6AD]">
              <Clock className="w-5 h-5 text-[#4B2E24]" />
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
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
                      ? 'bg-[#4B2E24] text-[#F7F5EF] border-[#4B2E24]'
                      : 'bg-[#F7F5EF] text-[#241914] border-[#D5C6AD] hover:bg-[#E9E6D8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleProfileSave}
              className="pt-4 border-t border-[#D5C6AD] flex flex-col sm:flex-row items-end gap-3"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Tên hiển thị của bạn
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                />
              </div>
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand shrink-0"
              >
                {updatingProfile ? 'Đang lưu...' : 'Lưu Tên'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION 4: TWO-FACTOR AUTHENTICATION (2FA / MFA FOR OWNER) */}
      <AdminMfaCard />
    </>
  );
};
