# HƯỚNG DẪN TRIỂN KHAI (DEPLOYMENT GUIDE) — TUNN COFFEE HOUSE

Tài liệu này hướng dẫn từng bước từ lúc cài đặt trên máy cá nhân (Local) cho đến khi đưa toàn bộ website **TUNN Coffee House** và hệ thống **Admin CMS** lên Internet miễn phí với **Supabase (Free Tier)** và **Cloudflare Pages (Free Tier)**.

---

## Kiến Trúc Hệ Thống

```
React 18 + Vite + TypeScript + Tailwind CSS (Customer Website + Admin CMS)
        │
        ▼
Supabase Client SDK (@supabase/supabase-js)
        │
        ├── Supabase Auth (Email/Password + Role-based Admin Authorization)
        ├── Supabase PostgreSQL (9 Tables + Row Level Security + Realtime Sync)
        ├── Supabase Storage (Bucket `tunn-media` + RLS Upload Policies)
        └── Supabase Edge Functions (`health-and-seo`)
        │
        ▼
Cloudflare Pages Free Hosting (Global CDN + Automatic HTTPS + Custom Domain)
```

> **Lưu ý về giới hạn gói Free hiện hành:**
>
> - **Supabase Free Plan:** Bao gồm 500MB PostgreSQL Database, 1GB Supabase Storage, 50,000 Monthly Active Users. Dự án Free có thể tạm dừng (pause) nếu không có truy cập trong 7 ngày liên tục — bạn có thể khôi phục trong 1 cú nhấp chuột trên Supabase Dashboard.
> - **Cloudflare Pages Free Plan:** Băng thông không giới hạn (Unlimited bandwidth), 500 lượt build/tháng, hỗ trợ SSL và tên miền riêng miễn phí.

---

## Bước 1: Cài Đặt Node.js

1. Tải và cài đặt **Node.js LTS** (phiên bản `>= 18.x` hoặc `20.x / 22.x / 24.x`) tại [https://nodejs.org](https://nodejs.org).
2. Kiểm tra phiên bản trong Terminal / PowerShell:
   ```bash
   node -v
   npm -v
   ```

---

## Bước 2: Cài Đặt Dependencies

Mở Terminal tại thư mục gốc của dự án (`c:\tunn`) và chạy:

```bash
npm install
```

---

## Bước 3: Chạy Thử Nghiệm Ở Máy Local

```bash
npm run dev
```

- Website khách hàng: `http://localhost:5173/`
- Trang đăng nhập Admin CMS: `http://localhost:5173/admin/login`

---

## Bước 4: Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập.
2. Nhấn **New Project**.
3. Đặt tên Project: `tunn-coffee-house`.
4. Tạo mật khẩu Database (lưu lại mật khẩu này ở nơi an toàn).
5. Chọn Region gần Việt Nam nhất: **Southeast Asia (Singapore)**.
6. Chọn gói **Free Plan ($0/month)** và nhấn **Create new project**.

---

## Bước 5: Chạy SQL Migration (Khởi Tạo Database, RLS & Storage)

1. Trên thanh menu trái của Supabase Dashboard, chọn **SQL Editor** → **New query**.
2. Mở file [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) trong source code dự án này.
3. Copy toàn bộ nội dung file SQL và dán vào khung SQL Editor của Supabase.
4. Nhấn **Run** (hoặc `Ctrl + Enter`).
5. Sau khi chạy thành công, toàn bộ 9 bảng (`profiles`, `site_settings`, `categories`, `products`, `media_assets`, `promotions`, `gallery_items`, `page_sections`, `admin_activity_logs`), các hàm kiểm tra quyền `public.is_admin()`, Row Level Security (RLS), Storage Bucket `tunn-media` và dữ liệu mẫu ban đầu của TUNN Coffee House sẽ được tạo tự động.

---

## Bước 6: Cấu Hình Supabase Authentication

1. Trong Supabase Dashboard, vào **Authentication** → **Providers** → **Email**.
2. Đảm bảo **Enable Email provider** đang bật.
3. _(Khuyến nghị khi thiết lập nhanh)_: Bạn có thể tạm tắt **Confirm email** nếu muốn đăng ký tài khoản Admin đầu tiên và đăng nhập ngay lập tức mà không cần bấm link xác nhận trong hộp thư.
4. Vào **Authentication** → **URL Configuration**:
   - **Site URL**: Điền URL website của bạn (ví dụ `http://localhost:5173` khi chạy local, hoặc `https://tunncoffee.pages.dev` sau khi deploy).
   - **Redirect URLs**: Thêm `https://tunncoffee.pages.dev/**` và `http://localhost:5173/**`.

---

## Bước 7: Kiểm Tra Cấu Hình Supabase Storage

1. Vào mục **Storage** trên Supabase Dashboard.
2. Bạn sẽ thấy bucket **`tunn-media`** (đã được tạo tự động ở Bước 5 với nhãn `PUBLIC`).
3. Các chính sách bảo mật (Policies) đã được thiết lập sẵn:
   - Khách truy cập công khai chỉ có quyền xem ảnh (`SELECT`).
   - Chỉ tài khoản có `role = 'admin'` mới được phép tải lên (`INSERT`), cập nhật (`UPDATE`) hoặc xóa (`DELETE`) hình ảnh.

---

## Bước 8: Cấu Hình Biến Môi Trường (Environment Variables)

1. Trên Supabase Dashboard, vào **Project Settings (biểu tượng bánh răng)** → **API**.
2. Sao chép 2 giá trị:
   - **Project URL** (ví dụ: `https://xyzcompany.supabase.co`)
   - **Project API Keys → `anon` `public`**
   - _(Tuyệt đối KHÔNG sử dụng `service_role` key ở frontend)_.
3. Tại thư mục gốc dự án, tạo file `.env` (copy từ `.env.example`):

```env
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Khởi động lại server local (`npm run dev`).

---

## Bước 9: Tạo Tài Khoản Admin Đầu Tiên

1. Truy cập `http://localhost:5173/admin/login`.
2. Chuyển sang tab **Tạo Admin đầu tiên**.
3. Nhập Họ tên, Email và Mật khẩu của chủ quán rồi nhấn **Khởi Tạo Tài Khoản Admin**.
4. Nhờ PostgreSQL Trigger `on_auth_user_created` trong migration:
   - **Tài khoản đầu tiên** đăng ký trong bảng `profiles` sẽ **tự động được cấp quyền `admin`**.
   - Mọi tài khoản đăng ký thứ 2 trở đi sẽ mặc định có quyền `staff` (không thể sửa dữ liệu CMS trừ khi được Admin nâng quyền trong bảng `public.profiles`).
5. Nếu bạn muốn cấp quyền Admin thủ công cho một email bất kỳ trong Supabase SQL Editor:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'email-cua-ban@domain.com';
   ```

---

## Bước 10: Đẩy Source Code Lên GitHub

1. Tạo một Repository mới trên [https://github.com](https://github.com) (ví dụ: `tunn-coffee-house`).
2. Chạy các lệnh Git trong thư mục dự án:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release TUNN Coffee House & Admin CMS"
   git branch -M main
   git remote add origin https://github.com/<username>/tunn-coffee-house.git
   git push -u origin main
   ```
   _(Lưu ý: File `.gitignore` đã tự động loại trừ `.env` và `node_modules` để bảo mật khóa của bạn)._

---

## Bước 11: Deploy Lên Cloudflare Pages (Miễn Phí)

1. Đăng nhập vào [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Vào mục **Workers & Pages** → Nhấn **Create** → Chọn tab **Pages** → **Connect to Git**.
3. Chọn tài khoản GitHub và chọn repository `tunn-coffee-house`.
4. Thiết lập cấu hình Build (**Build settings**):
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Mở mục **Environment variables (advanced)** và thêm 2 biến môi trường:
   - `VITE_SUPABASE_URL` = _(URL Supabase của bạn)_
   - `VITE_SUPABASE_ANON_KEY` = _(Anon public key của bạn)_
6. Nhấn **Save and Deploy**.
7. Sau khoảng 1 phút, Cloudflare Pages sẽ cung cấp cho bạn đường dẫn online dạng `https://tunn-coffee-house.pages.dev` (File `public/_redirects` đã được cấu hình sẵn để hỗ trợ React Router SPA trên mọi đường dẫn `/admin/*`).

---

## Bước 12: Cấu Hình Tên Miền Riêng (Custom Domain)

1. Trong trang quản lý dự án trên Cloudflare Pages, chọn tab **Custom domains**.
2. Nhấn **Set up a custom domain** và nhập tên miền của quán (ví dụ: `tunncoffee.vn` hoặc `www.tunncoffee.com`).
3. Cloudflare sẽ tự động cấu hình DNS record và cấp chứng chỉ bảo mật **SSL/HTTPS miễn phí**.

---

## Bước 13 — 16: Danh Sách Kiểm Tra Sau Khi Deploy Online

1. **Kiểm tra Website khách hàng online (`/`)**:
   - Logo TUNN Coffee House hiển thị đúng tỷ lệ ở Header, Hero, Footer và Favicon.
   - Menu lọc theo danh mục, tìm kiếm theo từ khóa và sắp xếp theo giá mượt mà.
   - Hình ảnh tải nhanh, giao diện tương thích trên cả Desktop và Mobile (`360px` – `430px`).
2. **Kiểm tra Admin CMS online (`/admin/login`)**:
   - Đăng nhập bằng tài khoản Admin.
   - Kiểm tra trạng thái góc trên bên phải báo **`Supabase Connected`** màu xanh lá.
3. **Kiểm tra Upload ảnh thật (`/admin/media`)**:
   - Tải thử 1 ảnh đồ uống từ máy tính lên.
   - Kiểm tra URL ảnh trả về từ Supabase Storage và thử gắn nhanh vào một sản phẩm.
4. **Kiểm tra CRUD & Đồng bộ tức thì**:
   - Vào `/admin/products` sửa giá hoặc thêm món mới → Mở trang khách hàng `/` kiểm tra món mới xuất hiện ngay mà không cần build lại code.

---

## Bước 17: Hướng Dẫn Sao Lưu (Backup Database & Hình Ảnh)

1. **Sao lưu dữ liệu PostgreSQL:**
   - Trong Supabase Dashboard → **Database** → **Backups**, hoặc sử dụng Supabase CLI / `pg_dump` để xuất toàn bộ dữ liệu định kỳ ra file `.sql`.
   - Bạn cũng có thể xuất nhanh từng bảng (`products`, `categories`, `site_settings`) ra file `.csv` trực tiếp trong **Table Editor** của Supabase.
2. **Sao lưu hình ảnh Storage:**
   - Trong Supabase Dashboard → **Storage** → **`tunn-media`**, bạn có thể tải xuống các thư mục ảnh quan trọng về máy tính định kỳ.
3. **Sao lưu Source Code:**
   - Toàn bộ mã nguồn được quản lý phiên bản an toàn trên GitHub Repository.
