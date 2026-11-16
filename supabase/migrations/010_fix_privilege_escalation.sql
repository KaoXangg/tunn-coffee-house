-- =============================================================================
-- TUNN COFFEE HOUSE — MIGRATION 010: FIX PRIVILEGE ESCALATION & SEARCH_PATH
-- =============================================================================
-- 1. Harden SECURITY DEFINER functions with explicit SET search_path = public.
-- 2. Remove client-controlled role elevation in handle_new_user() trigger.
-- 3. Restrict "Users can insert own profile" RLS policy to staff & non-owner.
-- 4. Revoke anon/public EXECUTE on owner_* RPCs; grant only to authenticated.
-- =============================================================================

-- 1. Harden is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2. Harden is_owner_admin()
CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_owner = TRUE
  );
END;
$$;

-- 3. Harden handle_new_user(): never trust raw_user_meta_data for role/owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role TEXT;
  assigned_owner BOOLEAN := FALSE;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
    assigned_owner := TRUE;
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
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

-- 4. Lock down self-insert RLS policy on public.profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'staff'
    AND is_owner = FALSE
  );

-- 5. Harden owner_reset_manager_password() with SET search_path = public
CREATE OR REPLACE FUNCTION public.owner_reset_manager_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 6. Harden owner_delete_manager() with SET search_path = public
CREATE OR REPLACE FUNCTION public.owner_delete_manager(
  target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 7. Restrict EXECUTE privileges on owner_* RPCs
REVOKE ALL ON FUNCTION public.owner_reset_manager_password(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_reset_manager_password(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.owner_delete_manager(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_delete_manager(UUID) TO authenticated;
