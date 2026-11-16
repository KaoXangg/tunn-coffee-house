BEGIN;
SELECT plan(3);

-- Ensure at least one owner and one non-owner sub-manager exist
INSERT INTO auth.users (id, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner-rpc@tunn.local'),
  ('33333333-3333-3333-3333-333333333333', 'submgr-rpc@tunn.local'),
  ('44444444-4444-4444-4444-444444444444', 'target-rpc@tunn.local')
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles
SET role = 'admin', is_owner = FALSE
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Act as non-owner sub-manager
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

-- 1. Non-owner cannot call owner_delete_manager
SELECT throws_ok(
  $$
    SELECT public.owner_delete_manager('44444444-4444-4444-4444-444444444444'::uuid);
  $$,
  'P0001',
  NULL,
  'Non-owner cannot execute owner_delete_manager'
);

-- 2. Non-owner cannot call owner_reset_manager_password
SELECT throws_ok(
  $$
    SELECT public.owner_reset_manager_password('44444444-4444-4444-4444-444444444444'::uuid, 'newpass123');
  $$,
  'P0001',
  NULL,
  'Non-owner cannot execute owner_reset_manager_password'
);

-- 3. anon must not have EXECUTE privilege on owner_delete_manager
RESET ROLE;
SELECT ok(
  NOT has_function_privilege('anon', 'public.owner_delete_manager(uuid)', 'EXECUTE'),
  'anon role does not have EXECUTE on owner_delete_manager'
);

SELECT * FROM finish();
ROLLBACK;
