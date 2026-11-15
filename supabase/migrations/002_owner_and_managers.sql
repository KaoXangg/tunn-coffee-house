-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 002: OWNER ADMIN & SUB-MANAGERS MANAGEMENT
-- =============================================================================
-- Run this SQL in Supabase SQL Editor to enable Owner-only password reset & deletion of sub-managers.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add is_owner column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark the earliest created admin (your root account) as the Owner (Admin gốc)
UPDATE public.profiles
SET is_owner = TRUE
WHERE id = (
  SELECT id FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1
);

-- 2. Helper function: Check if current user is the Root Owner Admin
CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_owner = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update handle_new_user trigger so when an Admin creates a new Manager via signUp,
-- if metadata contains requested_role = 'admin', it sets role = 'admin' (and is_owner = FALSE).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
  assigned_role TEXT;
  assigned_owner BOOLEAN := FALSE;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
    assigned_owner := TRUE;
  ELSIF NEW.raw_user_meta_data->>'created_by_owner' = 'true' THEN
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'assigned_role', 'admin');
    assigned_owner := FALSE;
  ELSE
    assigned_role := 'staff';
    assigned_owner := FALSE;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_owner)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    assigned_owner
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC Function: Owner Admin resets password for a Sub-Manager
CREATE OR REPLACE FUNCTION public.owner_reset_manager_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_owner_admin() THEN
    RAISE EXCEPTION 'Chỉ Admin gốc (Owner) mới có quyền cấp mật khẩu mới cho quản lý con.';
  END IF;

  IF char_length(new_password) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu mới phải có ít nhất 6 ký tự.';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC Function: Owner Admin deletes a Sub-Manager completely
CREATE OR REPLACE FUNCTION public.owner_delete_manager(
  target_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_owner_admin() THEN
    RAISE EXCEPTION 'Chỉ Admin gốc (Owner) mới có quyền xóa tài khoản quản lý con.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Không thể tự xóa tài khoản Admin gốc của chính mình.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND is_owner = TRUE) THEN
    RAISE EXCEPTION 'Không thể xóa tài khoản Admin gốc.';
  END IF;

  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Only Root Owner can delete activity logs (Sub-Managers cannot delete logs to hide actions)
DROP POLICY IF EXISTS "Owner can delete activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Owner can delete activity_logs"
  ON public.admin_activity_logs
  FOR DELETE
  USING (public.is_owner_admin());
