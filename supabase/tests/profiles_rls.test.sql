BEGIN;
SELECT plan(3);

-- Seed an existing owner so handle_new_user does not treat test users as first user
INSERT INTO auth.users (id, email)
VALUES ('11111111-1111-1111-1111-111111111111', 'owner-test@tunn.local')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email)
VALUES ('22222222-2222-2222-2222-222222222222', 'attacker@tunn.local')
ON CONFLICT (id) DO NOTHING;

-- Remove auto-created profile for attacker so we can test direct self-INSERT RLS
DELETE FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222';

-- Act as authenticated attacker
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

-- 1. Self-insert with role='admin' must fail RLS
SELECT throws_ok(
  $$
    INSERT INTO public.profiles (id, email, full_name, role, is_owner)
    VALUES ('22222222-2222-2222-2222-222222222222', 'attacker@tunn.local', 'Attacker', 'admin', FALSE);
  $$,
  '42501',
  NULL,
  'Regular user cannot self-insert profile with role = admin'
);

-- 2. Self-insert with is_owner=TRUE must fail RLS
SELECT throws_ok(
  $$
    INSERT INTO public.profiles (id, email, full_name, role, is_owner)
    VALUES ('22222222-2222-2222-2222-222222222222', 'attacker@tunn.local', 'Attacker', 'staff', TRUE);
  $$,
  '42501',
  NULL,
  'Regular user cannot self-insert profile with is_owner = TRUE'
);

-- 3. Self-insert with role='staff' and is_owner=FALSE is allowed
SELECT lives_ok(
  $$
    INSERT INTO public.profiles (id, email, full_name, role, is_owner)
    VALUES ('22222222-2222-2222-2222-222222222222', 'attacker@tunn.local', 'Normal Staff', 'staff', FALSE);
  $$,
  'Regular user can self-insert profile with role = staff and is_owner = FALSE'
);

SELECT * FROM finish();
ROLLBACK;
