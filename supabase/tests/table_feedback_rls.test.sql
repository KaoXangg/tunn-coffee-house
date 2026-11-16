BEGIN;
SELECT plan(4);

-- 1. After migration 014, anon must NOT be able to INSERT directly into table_feedback
SELECT ok(
  NOT has_table_privilege('anon', 'public.table_feedback', 'INSERT'),
  'anon cannot INSERT directly into table_feedback (must go through Edge Function)'
);

-- 2. Valid insert (via service_role/postgres) succeeds
SELECT lives_ok(
  $$
    INSERT INTO public.table_feedback (table_number, customer_name, customer_email, rating, tags, comment)
    VALUES ('Bàn 01', 'Khách Test', 'khachtestpgtap@gmail.com', 5, ARRAY['Đồ uống ngon'], 'Rất ngon');
  $$,
  'Valid feedback (rating 1-5, comment <= 300) succeeds'
);

-- 3. Rating = 0 violates CHECK constraint (23514)
SELECT throws_ok(
  $$
    INSERT INTO public.table_feedback (table_number, customer_name, customer_email, rating, comment)
    VALUES ('Bàn 02', 'Khách Test 2', 'khachtestpgtap2@gmail.com', 0, 'Bad rating');
  $$,
  '23514',
  NULL,
  'Rating = 0 is rejected by CHECK constraint'
);

-- 4. Rating = 6 violates CHECK constraint (23514)
SELECT throws_ok(
  $$
    INSERT INTO public.table_feedback (table_number, customer_name, customer_email, rating, comment)
    VALUES ('Bàn 03', 'Khách Test 3', 'khachtestpgtap3@gmail.com', 6, 'Out of range rating');
  $$,
  '23514',
  NULL,
  'Rating = 6 is rejected by CHECK constraint'
);

SELECT * FROM finish();
ROLLBACK;
