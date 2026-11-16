BEGIN;
SELECT plan(2);

-- Ensure profiles already has at least 1 row so next signup is not the first user
INSERT INTO auth.users (id, email)
VALUES ('11111111-1111-1111-1111-111111111111', 'seed-owner@tunn.local')
ON CONFLICT (id) DO NOTHING;

-- Simulate signup with forged client metadata
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'forged-signup@tunn.local',
  '{"created_by_owner": "true", "assigned_role": "admin", "full_name": "Forged User"}'::jsonb
);

SELECT is(
  (SELECT role FROM public.profiles WHERE id = '55555555-5555-5555-5555-555555555555'),
  'staff',
  'handle_new_user forces role = staff despite created_by_owner/assigned_role metadata'
);

SELECT is(
  (SELECT is_owner FROM public.profiles WHERE id = '55555555-5555-5555-5555-555555555555'),
  FALSE,
  'handle_new_user forces is_owner = FALSE despite forged metadata'
);

SELECT * FROM finish();
ROLLBACK;
