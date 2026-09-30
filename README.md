# 21AISYSTEM

Website bán khóa 21AISYSTEM: landing page, form đăng ký, chatbot, thanh toán QR (Sepay), CRM/admin, email tự động.
Web tĩnh + Vercel Functions (`api/`) + Supabase (Postgres). Production: https://www.tuananhvu.com

## Cấu trúc

| Đường dẫn | Việc |
|---|---|
| `index.html`, `course/` | Trang chủ, landing khóa học và form đăng ký |
| `thanh-toan/` | Trang thanh toán, tạo mã QR |
| `admin/` | Trang quản trị (CRM, đơn hàng, sản phẩm) |
| `api/register.js` | Nhận form đăng ký, tạo khách, bắt đầu chuỗi email |
| `api/checkout.js` | Tạo đơn hàng chờ thanh toán |
| `api/sepay-webhook.js` | Sepay báo có tiền, đơn chuyển `success`, gửi email xác nhận |
| `api/cron-sequence.js` | Cron gửi email chuỗi (chạy 02:00 UTC mỗi ngày, xem `vercel.json`) |
| `api/unsubscribe.js` | Link hủy nhận email |
| `api/admin.js` | API cho trang admin |
| `supabase/migrations/` | Cấu trúc database |

## Biến môi trường

Không đưa giá trị vào code hay git (`.env*` đã bị `.gitignore`). Chạy local: đặt trong `.env.local`. Production: đặt trên Vercel.

| Biến | Dùng để |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Kết nối database (chỉ server dùng) |
| `SEPAY_API_KEY` | Xác thực webhook Sepay |
| `SEPAY_BANK`, `SEPAY_ACCOUNT`, `SEPAY_ACCOUNT_NAME` | Thông tin tài khoản hiện trên QR |
| `RESEND_API_KEY`, `MAIL_FROM` | Gửi email |
| `ADMIN_PASSWORD`, `ADMIN_EMAIL` | Mật khẩu vào `/admin`, email nhận thông báo |
| `CRON_SECRET` | Bảo vệ endpoint cron |
| `UNSUB_SECRET` | Ký link hủy email. **Thiếu biến này thì không gửi email nào.** |
| `SEQUENCE_TEST_MODE` | Tùy chọn. `1` = email có `+test` nhận cả 3 email liền. **Tắt trên production.** |

Tạo giá trị ngẫu nhiên: `openssl rand -hex 32`

## Deploy lên Vercel

```bash
vercel env ls production      # kiểm tra đủ biến trong bảng trên
vercel env add TEN_BIEN production
vercel --prod                 # biến mới chỉ có hiệu lực sau khi deploy lại
```

Sau deploy, trong Sepay Dashboard trỏ webhook về `https://<domain>/api/sepay-webhook` với API key trùng `SEPAY_API_KEY`.

## Kiểm tra sau khi deploy

1. Điền form đăng ký bằng `ten+test@gmail.com`, kiểm tra có email chào mừng.
2. `/thanh-toan/` chọn gói "Test thanh toán 2.000đ", chuyển khoản thật, xem đơn lên `success` trong `/admin` và có email xác nhận.
3. Bấm link hủy trong email, kiểm tra hoạt động.

## Backup

Dữ liệu khách và đơn hàng nằm ở Supabase (Dashboard, Database, Backups, hoặc `supabase db dump`). `brain.db` cục bộ (SQLite) sao lưu bằng:

```bash
sqlite3 brain.db ".backup 'backups/brain-$(date +%F).db'"
```

## Việc bảo mật còn treo

Xem `vbsec-reports/` (không đưa lên git): đổi `ADMIN_PASSWORD` sang chuỗi ngẫu nhiên dài, rate limit `/api/register`, `/api/checkout`, `/api/admin`, và không cho form public ghi đè khách đã có.
