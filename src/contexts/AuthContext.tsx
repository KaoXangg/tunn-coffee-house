import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isOwnerAdmin: boolean;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpFirstAdmin: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null; message?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earliestAdminId, setEarliestAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser || !isSupabaseConfigured) {
      setProfile(null);
      return;
    }

    try {
      const [profileRes, firstAdminRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
        supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!firstAdminRes.error && firstAdminRes.data) {
        setEarliestAdminId(firstAdminRes.data.id);
      }

      const { data, error } = profileRes;

      if (error) {
        console.warn('Could not load user profile:', error.message);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        // Auto-provision profile if trigger hasn't fired yet
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        const role = (count ?? 0) === 0 ? 'admin' : 'staff';

        const { data: created } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name:
              currentUser.user_metadata?.full_name ||
              currentUser.email?.split('@')[0] ||
              'Admin',
            role,
          })
          .select('*')
          .maybeSingle();

        setProfile((created as Profile) || null);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Safety timeout so Admin never hangs indefinitely on slow network or lock contention
    const authTimeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession } }) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        await fetchProfile(currentSession?.user ?? null);
      })
      .catch((err) => {
        console.warn('Auth getSession warning:', err);
      })
      .finally(() => {
        window.clearTimeout(authTimeout);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        await fetchProfile(newSession?.user ?? null);
      } catch (err) {
        console.warn('Auth state change warning:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error:
          'Chưa cấu hình biến môi trường Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY). Vui lòng xem hướng dẫn thiết lập bên dưới.',
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileData && profileData.role !== 'admin') {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { error: 'ACCOUNT_LOCKED' };
      }

      await fetchProfile(data.user);
    }

    return { error: null };
  };

  const signUpFirstAdmin = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return {
        error:
          'Chưa cấu hình biến môi trường Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user && data.session) {
      await fetchProfile(data.user);
      return {
        error: null,
        message: 'Tài khoản đã được khởi tạo và đăng nhập thành công!',
      };
    }

    return {
      error: null,
      message:
        'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản (hoặc tắt Confirm Email trong Supabase Auth Settings để đăng nhập ngay).',
    };
  };

  const sendPasswordReset = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Chưa kết nối Supabase Project.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/login`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile(user);
  };

  const isAdmin = Boolean(profile?.role === 'admin');

  const isOwnerAdmin = Boolean(
    !isSupabaseConfigured ||
      profile?.is_owner === true ||
      (user?.id && earliestAdminId && user.id === earliestAdminId) ||
      user?.email?.toLowerCase() === 'caosang.101104@gmail.com'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isOwnerAdmin,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithEmail,
        signUpFirstAdmin,
        sendPasswordReset,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
