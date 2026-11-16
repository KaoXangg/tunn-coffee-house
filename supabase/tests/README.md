# Supabase pgTAP Security & RLS Tests

Các file test trong thư mục này kiểm tra tự động các chính sách RLS, RPC phân quyền Owner, trigger `handle_new_user`, và constraint của `table_feedback`.

## 1. Bật pgTAP
- Chạy migration `supabase/migrations/015_enable_pgtap.sql`, hoặc vào **Supabase Dashboard → Database → Extensions** và bật `pgtap`.

## 2. Chạy test với Supabase CLI (local)
```bash
supabase start
supabase test db
```

## 3. Hoặc chạy từng file bằng `psql` / `pg_prove`
```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/profiles_rls.test.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/owner_rpc.test.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/handle_new_user.test.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/table_feedback_rls.test.sql
```
*(Mỗi file đều bọc trong `BEGIN; ... ROLLBACK;` nên không để lại dữ liệu rác trong database.)*
