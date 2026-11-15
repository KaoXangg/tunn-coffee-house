import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck,
  KeyRound,
  Clock,
  Users,
  Trash2,
  Loader2,
  Lock,
  UserPlus,
  Crown,
  X,
  Check,
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
} from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateVi } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import type { Profile } from '../../types/database';

export const IDLE_TIMEOUT_STORAGE_KEY = 'tunn_admin_idle_timeout_minutes';

export const AdminSecurityPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { activityLogs, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();

  // 1. Update Own Password State
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

  // 4. Profiles & Sub-Managers Management State
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  // 5. Create New Sub-Manager Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newMgrName, setNewMgrName] = useState('');
  const [newMgrEmail, setNewMgrEmail] = useState('');
  const [newMgrPassword, setNewMgrPassword] = useState('');
  const [creatingMgr, setCreatingMgr] = useState(false);

  // 6. Owner Reset Sub-Manager Password Modal State
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resettingMgrPassword, setResettingMgrPassword] = useState(false);

  // 7. Owner Delete Sub-Manager Confirm State
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deletingMgr, setDeletingMgr] = useState(false);

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

  // Determine if the currently logged-in Admin is the Root Owner Admin (Admin gốc)
  // Root Owner is either explicitly marked is_owner = true OR is the earliest created admin in profiles
  const earliestAdminId = allProfiles.find((p) => p.role === 'admin')?.id;
  const isOwnerAdmin = Boolean(
    profile?.is_owner === true || (user?.id && user.id === earliestAdminId)
  );

  const isProfileRootOwner = (p: Profile) => {
    return Boolean(p.is_owner === true || p.id === earliestAdminId);
  };

  // Change own password
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

      await logAdminActivity('Đổi mật khẩu cá nhân', 'security', user?.email);
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

  // Update own display name
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

  // Save idle timeout
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

  // Create a new Sub-Manager account without logging out the current Admin
  const handleCreateSubManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase');
      return;
    }

    if (!newMgrName.trim() || !newMgrEmail.trim() || newMgrPassword.length < 6) {
      toast.error(
        'Thông tin chưa hợp lệ',
        'Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu (ít nhất 6 ký tự).'
      );
      return;
    }

    setCreatingMgr(true);
    try {
      // Use an isolated, non-persisting Supabase client so current Admin session is NOT overwritten
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data, error } = await tempClient.auth.signUp({
        email: newMgrEmail.trim().toLowerCase(),
        password: newMgrPassword,
        options: {
          data: {
            full_name: newMgrName.trim(),
            created_by_owner: 'true',
            assigned_role: 'admin',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Explicitly promote the newly created profile to 'admin' (Sub-Manager) using current Admin's RLS permission
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: newMgrEmail.trim().toLowerCase(),
          full_name: newMgrName.trim(),
          role: 'admin',
        });
      }

      await logAdminActivity(
        'Tạo tài khoản Quản lý con mới',
        'profiles',
        newMgrEmail.trim().toLowerCase()
      );
      await fetchAllProfiles();

      toast.success(
        'Đã thêm Quản lý mới thành công!',
        `Tài khoản ${newMgrEmail.trim()} đã có thể đăng nhập vào trang Admin.`
      );
      setNewMgrName('');
      setNewMgrEmail('');
      setNewMgrPassword('');
      setCreateModalOpen(false);
    } catch (err: any) {
      toast.error('Không thể tạo tài khoản Quản lý', err?.message);
    } finally {
      setCreatingMgr(false);
    }
  };

  // Change Sub-Manager role (Only Root Owner can change roles of other managers)
  const handleChangeUserRole = async (
    targetProfile: Profile,
    newRole: 'admin' | 'editor' | 'staff'
  ) => {
    if (!isSupabaseConfigured) return;

    if (!isOwnerAdmin) {
      toast.error(
        'Không đủ quyền hạn',
        'Chỉ Admin gốc (Owner) mới có quyền thay đổi cấp bậc của các Quản lý con.'
      );
      return;
    }

    if (isProfileRootOwner(targetProfile)) {
      toast.error(
        'Thao tác bị chặn',
        'Không thể hạ quyền của tài khoản Admin gốc.'
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
        `Đổi quyền ${targetProfile.email} sang ${newRole}`,
        'profiles',
        targetProfile.email
      );
      await fetchAllProfiles();
      toast.success(
        'Đã cập nhật quyền truy cập',
        `${targetProfile.email} → ${
          newRole === 'admin' ? 'Quản lý (Vào được Admin)' : 'Khóa quyền Admin'
        }`
      );
    }
  };

  // Root Owner resets password for a Sub-Manager
  const handleOwnerResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !isSupabaseConfigured) return;

    if (!isOwnerAdmin) {
      toast.error('Chỉ Admin gốc mới có quyền cấp mật khẩu mới.');
      return;
    }

    if (resetPasswordValue.length < 6) {
      toast.error('Mật khẩu quá ngắn', 'Mật khẩu mới cần ít nhất 6 ký tự.');
      return;
    }

    setResettingMgrPassword(true);
    try {
      const { error } = await supabase.rpc('owner_reset_manager_password', {
        target_user_id: resetTarget.id,
        new_password: resetPasswordValue,
      });

      if (error) {
        throw new Error(
          error.message.includes('owner_reset_manager_password')
            ? 'Vui lòng chạy file SQL 002_owner_and_managers.sql trong Supabase SQL Editor để kích hoạt tính năng cấp lại mật khẩu trực tiếp.'
            : error.message
        );
      }

      await logAdminActivity(
        'Cấp mật khẩu mới cho Quản lý con',
        'profiles',
        resetTarget.email
      );
      toast.success(
        'Đã cấp mật khẩu mới thành công!',
        `Mật khẩu mới đã được áp dụng cho ${resetTarget.email}.`
      );
      setResetTarget(null);
      setResetPasswordValue('');
    } catch (err: any) {
      toast.error('Không thể cấp mật khẩu mới', err?.message);
    } finally {
      setResettingMgrPassword(false);
    }
  };

  // Root Owner deletes a Sub-Manager
  const handleOwnerConfirmDelete = async () => {
    if (!deleteTarget || !isSupabaseConfigured) return;

    if (!isOwnerAdmin) {
      toast.error('Chỉ Admin gốc mới có quyền xóa tài khoản Quản lý con.');
      setDeleteTarget(null);
      return;
    }

    setDeletingMgr(true);
    try {
      // Try full auth + profile deletion via SECURITY DEFINER RPC first
      const { error: rpcError } = await supabase.rpc('owner_delete_manager', {
        target_user_id: deleteTarget.id,
      });

      if (rpcError) {
        // Fallback: revoke admin access and delete from profiles table
        const { error: fallbackErr } = await supabase
          .from('profiles')
          .delete()
          .eq('id', deleteTarget.id);
        if (fallbackErr) throw fallbackErr;
      }

      await logAdminActivity(
        'Xóa tài khoản Quản lý con',
        'profiles',
        deleteTarget.email
      );
      await fetchAllProfiles();
      toast.success('Đã xóa tài khoản Quản lý con', deleteTarget.email);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Lỗi khi xóa tài khoản', err?.message);
    } finally {
      setDeletingMgr(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#241914]">
            Quản Lý Người Dùng & Bảo Mật Hệ Thống
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Thêm tài khoản Quản lý con để vào trang Admin. Chỉ Admin gốc (Owner) mới có quyền cấp mật khẩu mới hoặc xóa các Quản lý con.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Quản Lý Mới</span>
        </button>
      </div>

      {/* SECTION 1: USER & MANAGER MANAGEMENT TABLE */}
      <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D5C6AD]">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#4B2E24]" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Danh Sách Ban Quản Trị & Phân Quyền ({allProfiles.length})
              </h2>
              <p className="text-xs text-[#8C7565]">
                Vai trò của bạn hiện tại:{' '}
                <strong className="text-[#4B2E24]">
                  {isOwnerAdmin
                    ? '👑 ADMIN GỐC (Toàn quyền thêm, xóa & cấp mật khẩu cho Quản lý con)'
                    : 'QUẢN LÝ VIÊN (Không thể xóa hoặc đổi mật khẩu của người khác)'}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {loadingProfiles ? (
          <div className="py-10 text-center text-xs text-[#8C7565]">
            Đang tải danh sách tài khoản...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E9E6D8] border-b border-[#D5C6AD] text-[11px] uppercase tracking-wider text-[#241914] font-semibold">
                  <th className="py-3 px-4">Người dùng / Quản lý</th>
                  <th className="py-3 px-4">Cấp bậc</th>
                  <th className="py-3 px-4">Quyền vào Admin</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">
                    Thao tác (Chỉ Admin Gốc)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E6D8] text-sm">
                {allProfiles.map((p) => {
                  const isRoot = isProfileRootOwner(p);
                  const isSelf = p.id === user?.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#F7F5EF]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#241914]">
                            {p.full_name || 'Quản lý viên'}
                          </span>
                          {isSelf && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#E9E6D8] text-[#4B2E24] rounded">
                              Đang đăng nhập
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8C7565]">{p.email}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRoot ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-brand">
                            <Crown className="w-3.5 h-3.5 text-amber-700" />
                            <span>Admin Gốc (Owner)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#F7F5EF] text-[#241914] border border-[#D5C6AD] rounded-brand">
                            <span>Quản lý con</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRoot ? (
                          <span className="text-xs font-semibold text-emerald-800">
                            Toàn quyền cố định
                          </span>
                        ) : (
                          <select
                            value={p.role}
                            disabled={!isOwnerAdmin}
                            onChange={(e) =>
                              handleChangeUserRole(
                                p,
                                e.target.value as 'admin' | 'editor' | 'staff'
                              )
                            }
                            className={`px-3 py-1.5 text-xs font-semibold rounded-brand border ${
                              p.role === 'admin'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : 'bg-stone-100 text-stone-600 border-stone-300'
                            } disabled:opacity-60`}
                          >
                            <option value="admin">
                              Cho phép vào Admin (Active)
                            </option>
                            <option value="staff">
                              Tạm khóa quyền vào Admin
                            </option>
                          </select>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#8C7565] whitespace-nowrap">
                        {formatDateVi(p.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isRoot ? (
                          <span className="text-xs text-[#8C7565] italic">
                            Được bảo vệ
                          </span>
                        ) : isOwnerAdmin ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setResetTarget(p);
                                setResetPasswordValue('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand transition-colors"
                              title="Cấp mật khẩu mới cho quản lý này"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Cấp mật khẩu mới</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-brand transition-colors"
                              title="Xóa tài khoản quản lý này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8C7565] italic">
                            Chỉ Admin gốc được phép
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: PERSONAL PASSWORD, IDLE TIMEOUT & AUDIT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 space-y-6">
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

        {/* Right Column: Audit Logs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5C6AD]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4B2E24]" />
                <h2 className="font-serif text-xl font-semibold text-[#241914]">
                  Nhật Ký Hoạt Động Quản Trị ({activityLogs.length})
                </h2>
              </div>
              {isOwnerAdmin && activityLogs.length > 0 && (
                <button
                  type="button"
                  disabled={clearingLogs}
                  onClick={handleClearLogs}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa nhật ký</span>
                </button>
              )}
            </div>

            {activityLogs.length === 0 ? (
              <p className="text-xs text-[#8C7565] py-6 text-center">
                Chưa có nhật ký hoạt động nào.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
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
                        Thực hiện bởi: {log.actor_email || 'Admin'}
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

      {/* MODAL 1: ADD NEW SUB-MANAGER */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div
            onClick={() => setCreateModalOpen(false)}
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-md bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#4B2E24]" />
                <h3 className="font-serif text-xl font-semibold text-[#241914]">
                  Thêm Tài Khoản Quản Lý Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-[#8C7565] hover:text-[#241914]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubManager} className="p-6 space-y-4">
              <p className="text-xs text-[#8C7565] leading-relaxed">
                Tạo tài khoản Quản lý con để nhân sự có thể đăng nhập vào trang <code className="font-mono">/admin</code> và phụ giúp bạn cập nhật món, hình ảnh.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Họ và Tên Quản lý *
                </label>
                <input
                  type="text"
                  required
                  value={newMgrName}
                  onChange={(e) => setNewMgrName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A (Quản lý ca)"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Email đăng nhập *
                </label>
                <input
                  type="email"
                  required
                  value={newMgrEmail}
                  onChange={(e) => setNewMgrEmail(e.target.value)}
                  placeholder="quanly@tunncoffee.com"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Mật khẩu khởi tạo (Tối thiểu 6 ký tự) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newMgrPassword}
                  onChange={(e) => setNewMgrPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cấp cho quản lý..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                />
              </div>

              <div className="pt-3 border-t border-[#D5C6AD] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] rounded-brand"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingMgr}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand disabled:opacity-50"
                >
                  {creatingMgr ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Tạo Tài Khoản Quản Lý</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: OWNER RESETS PASSWORD FOR SUB-MANAGER */}
      {resetTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div
            onClick={() => setResetTarget(null)}
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-md bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#4B2E24]" />
                <h3 className="font-serif text-xl font-semibold text-[#241914]">
                  Cấp Mật Khẩu Mới Cho Quản Lý
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="p-1 text-[#8C7565] hover:text-[#241914]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOwnerResetPassword} className="p-6 space-y-4">
              <div className="p-3 bg-white border border-[#D5C6AD] rounded-brand text-xs">
                <p className="font-semibold text-[#241914]">
                  {resetTarget.full_name}
                </p>
                <p className="text-[#8C7565]">{resetTarget.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Nhập mật khẩu mới (Tối thiểu 6 ký tự) *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Nhập mật khẩu mới để cấp cho quản lý..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#D5C6AD] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] rounded-brand"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resettingMgrPassword}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand disabled:opacity-50"
                >
                  {resettingMgrPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Xác Nhận Cấp Mật Khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG: OWNER DELETES SUB-MANAGER */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa tài khoản Quản lý con?"
        description={`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản quản lý "${deleteTarget?.full_name}" (${deleteTarget?.email})? Người này sẽ lập tức mất quyền đăng nhập vào hệ thống Admin.`}
        confirmLabel="Xóa tài khoản này"
        loading={deletingMgr}
        onConfirm={handleOwnerConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
