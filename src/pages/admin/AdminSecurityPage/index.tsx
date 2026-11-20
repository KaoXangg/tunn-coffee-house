import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
} from '../../../lib/supabase';
import {
  isValidIdentifierOrEmail,
  normalizeLoginIdentifier,
} from '../../../lib/managerAuth';
import { useAuth } from '../../../contexts/AuthContext';
import { useSiteData } from '../../../contexts/SiteDataContext';
import { useToast } from '../../../contexts/ToastContext';
import { IDLE_TIMEOUT_STORAGE_KEY } from '../../../lib/utils';
import { evaluatePasswordStrength } from '../../../lib/passwordPolicy';
import { ManagerTeamSection } from './ManagerTeamSection';
import { ActivityAuditSection } from './ActivityAuditSection';
import { AccountSecuritySection } from './AccountSecuritySection';
import { ManagerModals } from './ManagerModals';
import type { Profile, AdminActivityLog } from '../../../types/database';

export const AdminSecurityPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { activityLogs, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();

  // 1. Update Own Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // 2. Update Profile Name & Username State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(
    String(user?.user_metadata?.username || '')
  );
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

  // 8. Activity Logs & Session Duration Filters
  const [selectedManagerEmail, setSelectedManagerEmail] = useState<string>('all');
  const [selectedActionCategory, setSelectedActionCategory] = useState<
    'all' | 'data' | 'navigation' | 'session'
  >('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateLogs, setDateLogs] = useState<AdminActivityLog[] | null>(null);
  const [loadingDateLogs, setLoadingDateLogs] = useState(false);
  const [refreshingLogs, setRefreshingLogs] = useState(false);

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

  const [nowMs, setNowMs] = useState(() => Date.now());

  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    setFullName(profile?.full_name || '');
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNowMs(Date.now());
      void fetchAllProfiles();
    }, 0);
    return () => window.clearTimeout(timer);
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

  // Compute per-manager active duration, online status, current page, and action counts
  // Only include active profiles (deleted managers should not remain in active monitoring summary)
  const managerActivitySummary = useMemo(() => {
    const emailSet = new Set<string>();
    allProfiles.forEach((p) => {
      if (p.email) emailSet.add(p.email.toLowerCase());
    });

    return Array.from(emailSet).map((email) => {
      const matchedProfile = allProfiles.find(
        (p) => p.email?.toLowerCase() === email
      );
      const userLogs = activityLogs.filter(
        (l) => (l.actor_email || '').toLowerCase() === email
      );

      // Sort descending (newest first)
      const sortedDesc = [...userLogs].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latestLog = sortedDesc[0] || null;
      const latestLogMs = latestLog ? new Date(latestLog.created_at).getTime() : 0;

      // Online if latest log was within the last 5 minutes and not a logout ('session_end')
      const isOnline =
        Boolean(latestLog) &&
        nowMs - latestLogMs <= 5 * 60 * 1000 &&
        latestLog.entity_type !== 'session_end';

      // Group logs into sessions to calculate accurate session durations
      // 1) By explicit details.session_id if present
      // 2) Fallback: group consecutive logs within 30 minutes of each other
      const sessionDurationsMap = new Map<string, number>();
      const ascendingLogs = [...userLogs].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      let fallbackSessionIndex = 0;
      let prevTimeMs = 0;
      let fallbackSessionStartMs = 0;

      ascendingLogs.forEach((log) => {
        const t = new Date(log.created_at).getTime();
        const explicitSessionId = log.details?.session_id as string | undefined;
        const explicitDurationSec = Number(log.details?.session_duration_sec || 0);

        if (explicitSessionId) {
          const prevMax = sessionDurationsMap.get(explicitSessionId) || 0;
          if (explicitDurationSec > prevMax) {
            sessionDurationsMap.set(explicitSessionId, explicitDurationSec);
          } else if (prevMax === 0) {
            sessionDurationsMap.set(explicitSessionId, 30); // minimum 30s if only 1 log in session
          }
        } else {
          if (!prevTimeMs || t - prevTimeMs > 30 * 60 * 1000) {
            fallbackSessionIndex += 1;
            fallbackSessionStartMs = t;
          }
          const key = `legacy_${email}_${fallbackSessionIndex}`;
          const elapsedSec = Math.max(
            30,
            Math.round((t - fallbackSessionStartMs) / 1000)
          );
          sessionDurationsMap.set(key, elapsedSec);
          prevTimeMs = t;
        }
      });

      let totalDurationSec = 0;
      sessionDurationsMap.forEach((sec) => {
        totalDurationSec += sec;
      });

      // Latest session duration
      let latestSessionDurationSec = 0;
      if (latestLog) {
        const latestSessId =
          typeof latestLog.details?.session_id === 'string'
            ? latestLog.details.session_id
            : '';
        if (latestSessId && sessionDurationsMap.has(latestSessId)) {
          latestSessionDurationSec = sessionDurationsMap.get(latestSessId) || 0;
        } else {
          latestSessionDurationSec =
            Number(latestLog.details?.session_duration_sec || 0) ||
            (totalDurationSec > 0 ? totalDurationSec : 0);
        }
      }

      const dataEditCount = userLogs.filter(
        (l) =>
          !['navigation', 'session_start', 'session_end', 'session_heartbeat'].includes(
            l.entity_type
          )
      ).length;

      const pageViewCount = userLogs.filter((l) =>
        ['navigation', 'session_start'].includes(l.entity_type)
      ).length;

      const currentPage =
        latestLog?.details?.page_label ||
        latestLog?.details?.page_path ||
        (latestLog?.entity_type === 'navigation' ? latestLog.action : null) ||
        'Dashboard';

      return {
        email,
        fullName:
          matchedProfile?.full_name ||
          latestLog?.details?.actor_name ||
          email.split('@')[0],
        profile: matchedProfile || null,
        isOnline,
        latestLog,
        currentPage,
        latestSessionDurationSec,
        totalDurationSec,
        sessionCount: sessionDurationsMap.size,
        totalActions: userLogs.filter((l) => l.entity_type !== 'session_heartbeat')
          .length,
        dataEditCount,
        pageViewCount,
      };
    });
  }, [allProfiles, activityLogs, nowMs]);

  // Fetch all logs for a specific calendar date directly from Supabase (so older days beyond the latest 200 logs are always viewable)
  useEffect(() => {
    if (!selectedDate || !isSupabaseConfigured) {
      return;
    }

    let cancelled = false;
    const fetchForDate = async () => {
      setLoadingDateLogs(true);
      try {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const start = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
        const end = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);

        const { data, error } = await supabase
          .from('admin_activity_logs')
          .select('*')
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .limit(500);

        if (!cancelled && !error && data) {
          setDateLogs(data as AdminActivityLog[]);
        }
      } finally {
        if (!cancelled) setLoadingDateLogs(false);
      }
    };

    const timer = window.setTimeout(() => {
      void fetchForDate();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedDate]);

  // Filter detailed activity logs (hide silent heartbeats unless needed, show page views, logins, data edits)
  const filteredActivityLogs = useMemo(() => {
    const sourceLogs = selectedDate ? dateLogs || [] : activityLogs;
    return sourceLogs.filter((log) => {
      if (log.entity_type === 'session_heartbeat') return false;

      if (selectedDate) {
        const d = new Date(log.created_at);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        if (`${y}-${m}-${day}` !== selectedDate) {
          return false;
        }
      }

      if (
        selectedManagerEmail !== 'all' &&
        (log.actor_email || '').toLowerCase() !== selectedManagerEmail.toLowerCase()
      ) {
        return false;
      }

      if (selectedActionCategory === 'data') {
        return !['navigation', 'session_start', 'session_end', 'security'].includes(
          log.entity_type
        );
      }
      if (selectedActionCategory === 'navigation') {
        return log.entity_type === 'navigation';
      }
      if (selectedActionCategory === 'session') {
        return ['session_start', 'session_end', 'security', 'profiles'].includes(
          log.entity_type
        );
      }
      return true;
    });
  }, [activityLogs, dateLogs, selectedDate, selectedManagerEmail, selectedActionCategory]);

  const handleRefreshLogs = async () => {
    setRefreshingLogs(true);
    try {
      await refreshAll();
      await fetchAllProfiles();
      toast.info('Đã cập nhật nhật ký hoạt động mới nhất');
    } finally {
      setRefreshingLogs(false);
    }
  };

  const getLogBadge = (log: AdminActivityLog) => {
    if (log.entity_type === 'session_start') {
      return {
        label: 'Đăng nhập / Mở phiên',
        cls: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      };
    }
    if (log.entity_type === 'session_end') {
      return {
        label: 'Đăng xuất / Khóa phiên',
        cls: 'bg-purple-100 text-purple-900 border-purple-300',
      };
    }
    if (log.entity_type === 'navigation') {
      return {
        label: 'Chuyển trang / Xem mục',
        cls: 'bg-sky-100 text-sky-900 border-sky-300',
      };
    }
    if (log.entity_type === 'profiles' || log.entity_type === 'security') {
      return {
        label: 'Bảo mật & Tài khoản',
        cls: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }
    if (log.action.toLowerCase().includes('xóa') || log.action.toLowerCase().includes('tạm hết')) {
      return {
        label: 'Xóa / Báo hết',
        cls: 'bg-red-100 text-red-900 border-red-300',
      };
    }
    return {
      label: 'Chỉnh sửa dữ liệu',
      cls: 'bg-ivory text-coffee border-coffee-beige',
    };
  };

  // Change own password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase');
      return;
    }

    const pwCheck = evaluatePasswordStrength(newPassword, user?.email);
    if (!pwCheck.valid) {
      toast.error('Mật khẩu chưa đạt chuẩn bảo mật', pwCheck.errorMessage || undefined);
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
    } catch (err: unknown) {
      toast.error('Không thể đổi mật khẩu', err instanceof Error ? err.message : undefined);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Update own display name & optional login username
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !user) return;
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername && !/^[a-zA-Z0-9._-]{3,32}$/.test(cleanUsername)) {
      toast.error(
        'Tên đăng nhập chưa hợp lệ',
        'Chỉ gồm 3-32 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.'
      );
      return;
    }
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);
      if (error) throw error;

      const { error: authErr } = await supabase.auth.updateUser({
        data: { username: cleanUsername || null },
      });
      if (authErr) throw authErr;

      await refreshProfile();
      await fetchAllProfiles();
      toast.success('Đã cập nhật hồ sơ & tên đăng nhập');
    } catch (err: unknown) {
      toast.error('Lỗi cập nhật hồ sơ', err instanceof Error ? err.message : undefined);
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

    if (!newMgrName.trim() || !newMgrEmail.trim()) {
      toast.error(
        'Thông tin chưa hợp lệ',
        'Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập hoặc Email.'
      );
      return;
    }

    if (!isValidIdentifierOrEmail(newMgrEmail)) {
      toast.error(
        'Tên đăng nhập / Email chưa hợp lệ',
        'Tên đăng nhập gồm 3-32 ký tự (chữ, số, ., _, -) hoặc nhập Email hợp lệ.'
      );
      return;
    }

    const mgrPwCheck = evaluatePasswordStrength(newMgrPassword, newMgrEmail);
    if (!mgrPwCheck.valid) {
      toast.error('Mật khẩu chưa đạt chuẩn bảo mật', mgrPwCheck.errorMessage || undefined);
      return;
    }

    setCreatingMgr(true);
    try {
      const displayIdentifier = newMgrEmail.trim().toLowerCase();
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        displayIdentifier?: string;
        error?: string;
      }>('create-manager', {
        body: {
          fullName: newMgrName.trim(),
          identifier: displayIdentifier,
          password: newMgrPassword,
        },
      });

      if (error || data?.error || !data?.ok) {
        let serverError = data?.error;
        if (!serverError && error && typeof error === 'object' && 'context' in error) {
          const ctx = (error as { context?: unknown }).context;
          if (ctx instanceof Response) {
            try {
              const json = (await ctx.clone().json()) as { error?: string };
              serverError = json?.error;
            } catch {
              // ignore non-JSON body
            }
          }
        }
        throw new Error(
          serverError ||
            'Không thể tạo tài khoản Quản lý. Hãy kiểm tra Edge Function create-manager đã được triển khai.'
        );
      }

      await logAdminActivity(
        'Tạo tài khoản Quản lý mới',
        'profiles',
        normalizeLoginIdentifier(displayIdentifier)
      );
      await fetchAllProfiles();

      toast.success(
        'Đã thêm Quản lý mới thành công!',
        `Tài khoản ${data.displayIdentifier || displayIdentifier} đã có thể đăng nhập ngay vào trang Admin.`
      );
      setNewMgrName('');
      setNewMgrEmail('');
      setNewMgrPassword('');
      setCreateModalOpen(false);
    } catch (err: unknown) {
      toast.error('Không thể tạo tài khoản Quản lý', err instanceof Error ? err.message : undefined);
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
        'Chỉ Admin mới có quyền thay đổi cấp bậc của các Quản lý.'
      );
      return;
    }

    if (isProfileRootOwner(targetProfile)) {
      toast.error(
        'Thao tác bị chặn',
        'Không thể hạ quyền của tài khoản Admin.'
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
      toast.error('Chỉ Admin mới có quyền cấp mật khẩu mới.');
      return;
    }

    const resetPwCheck = evaluatePasswordStrength(resetPasswordValue, resetTarget.email);
    if (!resetPwCheck.valid) {
      toast.error('Mật khẩu chưa đạt chuẩn bảo mật', resetPwCheck.errorMessage || undefined);
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
        'Cấp mật khẩu mới cho Quản lý',
        'profiles',
        resetTarget.email
      );
      toast.success(
        'Đã cấp mật khẩu mới thành công!',
        `Mật khẩu mới đã được áp dụng cho ${resetTarget.email}.`
      );
      setResetTarget(null);
      setResetPasswordValue('');
    } catch (err: unknown) {
      toast.error('Không thể cấp mật khẩu mới', err instanceof Error ? err.message : undefined);
    } finally {
      setResettingMgrPassword(false);
    }
  };

  // Root Owner deletes a Sub-Manager
  const handleOwnerConfirmDelete = async () => {
    if (!deleteTarget || !isSupabaseConfigured) return;

    if (!isOwnerAdmin) {
      toast.error('Chỉ Admin mới có quyền xóa tài khoản Quản lý.');
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
        'Xóa tài khoản Quản lý',
        'profiles',
        deleteTarget.email
      );
      await fetchAllProfiles();
      toast.success('Đã xóa tài khoản Quản lý', deleteTarget.email);
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error('Lỗi khi xóa tài khoản', err instanceof Error ? err.message : undefined);
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
    } catch (err: unknown) {
      toast.error('Không thể xóa nhật ký', err instanceof Error ? err.message : undefined);
    } finally {
      setClearingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Quản Lý Người Dùng & Bảo Mật Hệ Thống
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Thêm tài khoản Quản lý để vào trang Admin. Chỉ Admin mới có quyền cấp mật khẩu mới hoặc xóa các Quản lý.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Quản Lý Mới</span>
        </button>
      </div>

      {isOwnerAdmin && (
        <ManagerTeamSection
          allProfiles={allProfiles}
          loadingProfiles={loadingProfiles}
          isOwnerAdmin={isOwnerAdmin}
          currentUserId={user?.id}
          isProfileRootOwner={isProfileRootOwner}
          onChangeUserRole={handleChangeUserRole}
          onOpenResetModal={setResetTarget}
          onChangeResetPasswordValue={setResetPasswordValue}
          onRequestDelete={setDeleteTarget}
        />
      )}

      <ActivityAuditSection
        isOwnerAdmin={isOwnerAdmin}
        clearingLogs={clearingLogs}
        refreshingLogs={refreshingLogs}
        managerActivitySummary={managerActivitySummary}
        allProfiles={allProfiles}
        activityLogs={activityLogs}
        filteredActivityLogs={filteredActivityLogs}
        selectedManagerEmail={selectedManagerEmail}
        selectedActionCategory={selectedActionCategory}
        selectedDate={selectedDate}
        loadingDateLogs={loadingDateLogs}
        getLogBadge={getLogBadge}
        onRefreshLogs={handleRefreshLogs}
        onChangeSelectedManager={setSelectedManagerEmail}
        onChangeActionCategory={setSelectedActionCategory}
        onChangeSelectedDate={(d) => {
          if (!d) setDateLogs(null);
          setSelectedDate(d);
        }}
        onClearLogs={handleClearLogs}
      />

      <AccountSecuritySection
        userEmail={user?.email}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        updatingPassword={updatingPassword}
        idleMinutes={idleMinutes}
        fullName={fullName}
        username={username}
        updatingProfile={updatingProfile}
        onChangeNewPassword={setNewPassword}
        onChangeConfirmPassword={setConfirmPassword}
        onPasswordChange={handlePasswordChange}
        onSaveIdleTimeout={handleSaveIdleTimeout}
        onChangeFullName={setFullName}
        onChangeUsername={setUsername}
        onProfileSave={handleProfileSave}
      />

      <ManagerModals
        createModalOpen={createModalOpen}
        newMgrName={newMgrName}
        newMgrEmail={newMgrEmail}
        newMgrPassword={newMgrPassword}
        creatingMgr={creatingMgr}
        resetTarget={resetTarget}
        resetPasswordValue={resetPasswordValue}
        resettingMgrPassword={resettingMgrPassword}
        deleteTarget={deleteTarget}
        deletingMgr={deletingMgr}
        onChangeNewMgrName={setNewMgrName}
        onChangeNewMgrEmail={setNewMgrEmail}
        onChangeNewMgrPassword={setNewMgrPassword}
        onCreateManager={handleCreateSubManager}
        onCloseCreateModal={() => setCreateModalOpen(false)}
        onChangeResetPasswordValue={setResetPasswordValue}
        onResetManagerPassword={handleOwnerResetPassword}
        onCloseResetModal={() => setResetTarget(null)}
        onConfirmDelete={handleOwnerConfirmDelete}
        onCloseDeleteModal={() => setDeleteTarget(null)}
      />
    </div>
  );
};
