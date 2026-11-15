import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Clock,
  Users,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateVi } from '../../lib/utils';
import type { Profile } from '../../types/database';

export const IDLE_TIMEOUT_STORAGE_KEY = 'tunn_admin_idle_timeout_minutes';

export const AdminSecurityPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { activityLogs, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();

  // 1. Update Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // 2. Update Profile Name State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // 3. Auto Session Timeout State
  const [idleMinutes, setIdleMinutes] = useState<number>(() => {
    const saved = localStorage.getItem(IDLE_TIMEOUT_STORAGE_KEY);
    return saved ? Number(saved) : 30;
  });

  // 4. Profiles Role Management State
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  const fetchAllProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setAllProfiles(data as Profile[]);
      }
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile]);

  useEffect(() => {
    fetchAllProfiles();
  }, [fetchAllProfiles]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu quá ngắn', 'Mật khẩu mới cần ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp', 'Vui lòng nhập lại chính xác.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      await logAdminActivity('Đổi mật khẩu quản trị', 'security', user?.email);
      setNewPassword('');
      setConfirmPassword('');
      toast.success(
        'Đã đổi mật khẩu thành công!',
        'Mật khẩu mới đã được áp dụng cho tài khoản của bạn.'
      );
    } catch (err: any) {
      toast.error('Không thể đổi mật khẩu', err?.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !user) return;
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      await fetchAllProfiles();
      toast.success('Đã cập nhật tên hiển thị');
    } catch (err: any) {
      toast.error('Lỗi cập nhật hồ sơ', err?.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSaveIdleTimeout = (minutes: number) => {
    setIdleMinutes(minutes);
    localStorage.setItem(IDLE_TIMEOUT_STORAGE_KEY, String(minutes));
    window.dispatchEvent(new Event('tunn-idle-timeout-updated'));
    toast.success(
      'Đã lưu cấu hình Tự động khóa phiên',
      minutes === 0
        ? 'Đã tắt tự động đăng xuất.'
        : `Hệ thống sẽ tự động đăng xuất sau ${minutes} phút không thao tác.`
    );
  };

  const handleChangeUserRole = async (
    targetProfile: Profile,
    newRole: 'admin' | 'editor' | 'staff'
  ) => {
    if (!isSupabaseConfigured) return;

    if (targetProfile.id === user?.id && newRole !== 'admin') {
      toast.error(
        'Thao tác bị chặn để bảo vệ bạn',
        'Bạn không thể tự hạ quyền Admin của chính mình đang đăng nhập.'
      );
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetProfile.id);

    if (error) {
      toast.error('Không thể đổi vai trò', error.message);
    } else {
      await logAdminActivity(
        `Thay đổi quyền tài khoản sang ${newRole}`,
        'profiles',
        targetProfile.email
      );
      await fetchAllProfiles();
      toast.success(
        'Đã cập nhật phân quyền',
        `${targetProfile.email} → ${newRole.toUpperCase()}`
      );
    }
  };

  const handleClearLogs = async () => {
    if (!isSupabaseConfigured) return;
    setClearingLogs(true);
    try {
      const { error } = await supabase
        .from('admin_activity_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      await refreshAll();
      toast.success('Đã dọn sạch nhật ký hoạt động');
    } catch (err: any) {
      toast.error('Không thể xóa nhật ký', err?.message);
    } finally {
      setClearingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[#241914]">
          Bảo Mật & Phân Quyền Tài Khoản
        </h1>
        <p className="text-sm text-[#8C7565] mt-1">
          Đổi mật khẩu quản trị, hẹn giờ tự động khóa phiên tại quầy và kiểm soát danh sách quyền truy cập hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Change Password & Auto-Lock */}
        <div className="lg:col-span-6 space-y-6">
          {/* Password Card */}
          <form
            onSubmit={handlePasswordChange}
            className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#D5C6AD]">
              <KeyRound className="w-5 h-5 text-[#4B2E24]" />
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Đổi Mật Khẩu Quản Trị Viên
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C7565] mb-1">
                Tài khoản đang đăng nhập
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'caosang.101104@gmail.com'}
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
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
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
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
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
              <span>Cập Nhật Mật Khẩu Mới</span>
            </button>
          </form>

          {/* Auto Session Timeout Card */}
          <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#D5C6AD]">
              <Clock className="w-5 h-5 text-[#4B2E24]" />
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#241914]">
                  Tự Động Khóa Phiên Khi Không Hoạt Động
                </h2>
              </div>
            </div>

            <p className="text-xs text-[#8C7565] leading-relaxed">
              Nếu bạn mở trang Admin trên máy tính ở quầy thu ngân rồi rời đi, hệ thống sẽ tự động đăng xuất sau khoảng thời gian không có thao tác chuột hoặc bàn phím để ngăn người lạ bấm sửa dữ liệu.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { label: '15 phút', val: 15 },
                { label: '30 phút (Khuyên dùng)', val: 30 },
                { label: '60 phút', val: 60 },
                { label: 'Không tự khóa', val: 0 },
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

            {/* Display Name Editor */}
            <form
              onSubmit={handleProfileSave}
              className="pt-4 border-t border-[#D5C6AD] flex flex-col sm:flex-row items-end gap-3"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Tên hiển thị của bạn trên Sidebar
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

        {/* Right Column: Profiles Role List & Security Status */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5C6AD]">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#4B2E24]" />
                <h2 className="font-serif text-xl font-semibold text-[#241914]">
                  Danh Sách Tài Khoản Hệ Thống ({allProfiles.length})
                </h2>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-brand text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>Chính sách bảo mật RLS đang bật:</strong> Chỉ những tài khoản có vai trò <code className="font-bold">admin</code> mới có quyền thêm, sửa, xóa món hoặc upload ảnh. Tài khoản <code className="font-bold">staff</code> hoàn toàn bị chặn quyền ghi dữ liệu.
              </div>
            </div>

            {loadingProfiles ? (
              <div className="py-8 text-center text-xs text-[#8C7565]">
                Đang tải danh sách tài khoản...
              </div>
            ) : allProfiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8C7565]">
                Chưa có dữ liệu hồ sơ.
              </div>
            ) : (
              <div className="divide-y divide-[#E9E6D8]">
                {allProfiles.map((p) => {
                  const isSelf = p.id === user?.id;
                  return (
                    <div
                      key={p.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#241914]">
                            {p.full_name || 'Người dùng'}
                          </span>
                          {isSelf && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#E9E6D8] text-[#4B2E24] rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8C7565]">{p.email}</p>
                        <p className="text-[10px] text-[#8C7565] mt-0.5">
                          Tạo ngày: {formatDateVi(p.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={p.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            handleChangeUserRole(
                              p,
                              e.target.value as 'admin' | 'editor' | 'staff'
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-brand border ${
                            p.role === 'admin'
                              ? 'bg-[#4B2E24] text-[#F7F5EF] border-[#4B2E24]'
                              : 'bg-[#F7F5EF] text-[#241914] border-[#D5C6AD]'
                          } disabled:opacity-80`}
                        >
                          <option value="admin">ADMIN (Toàn quyền)</option>
                          <option value="staff">STAFF (Khóa quyền sửa)</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security Audit Log Management */}
          <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5C6AD]">
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Nhật Ký Bảo Mật & Thao Tác ({activityLogs.length})
              </h2>
              {activityLogs.length > 0 && (
                <button
                  type="button"
                  disabled={clearingLogs}
                  onClick={handleClearLogs}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dọn nhật ký</span>
                </button>
              )}
            </div>

            {activityLogs.length === 0 ? (
              <p className="text-xs text-[#8C7565] py-4 text-center">
                Chưa có nhật ký hoạt động nào.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#F7F5EF] border border-[#D5C6AD]/70 rounded-brand text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-[#241914]">
                        {log.action}
                      </span>
                      {log.entity_name && (
                        <span className="text-[#4B2E24] ml-1.5">
                          · {log.entity_name}
                        </span>
                      )}
                      <p className="text-[10px] text-[#8C7565] mt-0.5">
                        {log.actor_email || 'Admin'}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#8C7565] shrink-0">
                      {formatDateVi(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
