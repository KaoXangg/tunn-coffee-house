# TUNN Coffee House — Premium Editorial Website & Full Admin CMS

Website thương hiệu trà sữa, trà trái cây, cà phê đặc sản và matcha thủ công **TUNN Coffee House** kèm hệ thống quản trị nội dung **Full Admin CMS** vận hành trên kiến trúc Serverless (React + Vite + TypeScript + Tailwind CSS + Supabase PostgreSQL/Auth/Storage + Cloudflare Pages).

## Điểm Nổi Bật

- **Thiết kế Editorial Warm Luxury**: Bảng màu chuẩn thương hiệu (`#E9E6D8` Warm Ivory, `#4B2E24` Coffee Brown, `#241914` Dark Espresso, `#D5C6AD` Warm Beige, `#F7F5EF` Cream White, `#8C7565` Muted Brown) cùng sự kết hợp giữa font Serif (`Cormorant Garamond`) và Sans-serif (`Plus Jakarta Sans`).
- **Logo TUNN Coffee House đồng bộ**: Hiển thị nguyên bản tại Header, Hero Seal, Footer, Admin Sidebar, Trang đăng nhập Admin và Favicon, đồng thời cho phép Admin thay đổi bất cứ lúc nào.
- **Hệ thống Admin CMS toàn diện (`/admin`)**:
  - `/admin/login`: Đăng nhập, tạo tài khoản Admin đầu tiên, khôi phục mật khẩu với Supabase Auth & phân quyền RLS (`role = 'admin'`).
  - `/admin/dashboard`: Thống kê tổng quan, thao tác nhanh, nhật ký hoạt động.
  - `/admin/products`: CRUD sản phẩm đầy đủ, lọc, tìm kiếm, phân trang, chỉnh giá/giá giảm, trạng thái còn món, đánh dấu Featured & Best Seller.
  - `/admin/categories`: CRUD danh mục, kiểm tra ràng buộc khóa ngoại sản phẩm trước khi xóa.
  - `/admin/media`: Upload một hoặc nhiều ảnh lên Supabase Storage (`tunn-media`), kiểm tra định dạng & bảo mật SVG, xem kích thước/dung lượng, copy URL và gắn nhanh ảnh vào Sản phẩm / Hero / About / Banner / Gallery.
  - `/admin/sections/hero`: Trình chỉnh sửa trực quan Hero Section kèm Live Preview.
  - `/admin/content`: Bật/tắt và sắp xếp lại thứ tự các section trên trang chủ, sửa câu chuyện thương hiệu (About), Header Navigation và Footer.
  - `/admin/promotions`: CRUD chương trình ưu đãi & bộ sưu tập theo mùa.
  - `/admin/gallery`: CRUD thư viện hình ảnh Masonry theo tỷ lệ khung hình.
  - `/admin/brand`: Quản lý Logo, Favicon, tên thương hiệu, slogan kèm Live Preview.
  - `/admin/settings/appearance`: Tùy chỉnh bảng màu, font chữ, độ bo góc và kiểu nút bấm.
  - `/admin/settings/contact`: Quản lý địa chỉ, hotline, email, giờ mở cửa, Google Maps và mạng xã hội.
  - `/admin/settings/seo`: Quản lý thẻ SEO Title, Meta Description, Keywords, Open Graph Image kèm bản xem trước Google & Facebook.

## Khởi Chạy Nhanh

```bash
# 1. Cài đặt gói phụ thuộc
npm install

# 2. Sao chép file cấu hình môi trường và điền thông tin Supabase của bạn
cp .env.example .env

# 3. Chạy máy chủ phát triển
npm run dev

# 4. Build bản Production
npm run build
```

Xem hướng dẫn chi tiết từng bước khởi tạo Supabase SQL Migration và triển khai miễn phí lên Cloudflare Pages tại **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**.
