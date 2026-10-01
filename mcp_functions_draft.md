# MCP functions — ai21day (tuananhvu.com)

Mô hình: website + API chạy trên **Vercel**, dữ liệu ở **Supabase**. MCP server chạy trên **VPS** cạnh goClaw,
đọc/ghi cùng Supabase → thay đổi qua Telegram hiện ngay trên website.

```
Telegram ──→ goClaw (VPS, Docker) ──→ MCP (VPS, host) ──→ Supabase ←── Website (Vercel)
```

Prefix trong goClaw: `biz` → tên tool cuối cùng là `biz__<tên>`.

---

## 1. `doi_tieu_de_landing` — ưu tiên 5

- **Input:** `dong_1` (string, 1–60 ký tự, bắt buộc), `dong_2` (string, 0–60 ký tự, tùy chọn — bỏ trống để tiêu đề chỉ 1 dòng)
- **Output:** tiêu đề cũ → tiêu đề mới, thời điểm cập nhật
- **Làm gì:** ghi `hero_title_1`, `hero_title_2` vào bảng `site_settings`; landing đọc qua `/api/settings` (cache CDN 5 giây)
- **Tình huống:** chạy flash sale / đổi thông điệp landing ngay khi nảy ý tưởng, không mở laptop
- **Câu nhắn Telegram ví dụ:**
  - "Đổi tiêu đề landing thành 'Flash sale cuối tuần 30%'"
  - "Tiêu đề trang chủ đổi thành: dòng 1 'Khoá 21AISYSTEM', dòng 2 'mở đăng ký đợt 2.'"
  - "Trả tiêu đề landing về như cũ: 'Tôi xây hệ thống giúp doanh nghiệp' / 'kéo khách bằng AI.'"

## 2. `bao_cao_don_hom_nay` — ưu tiên 5

- **Input:** `ngay` (string `YYYY-MM-DD`, tùy chọn — mặc định hôm nay theo giờ Việt Nam)
- **Output:** tổng đơn tạo trong ngày, số đơn đã thanh toán + doanh thu, số đơn chờ / huỷ, danh sách tối đa 20 đơn (mã, sản phẩm, số tiền, trạng thái, giờ)
- **Làm gì:** đọc bảng `orders` (join `products`), tính theo ngày giờ Việt Nam (UTC+7)
- **Tình huống:** cuối ngày hoặc giữa buổi muốn biết bán được bao nhiêu
- **Câu nhắn Telegram ví dụ:**
  - "Hôm nay có bao nhiêu đơn rồi?"
  - "Doanh thu hôm qua bao nhiêu?"
  - "Báo cáo đơn ngày 2026-09-30"

## 3. `dang_ky_moi` — ưu tiên 4

- **Input:** `so_ngay` (integer 1–30, mặc định 1 = từ 0h hôm nay), `gioi_han` (integer 1–50, mặc định 10)
- **Output:** tổng số người đăng ký form khoá học trong khoảng, danh sách mới nhất: tên, SĐT/email **đã che bớt**, lĩnh vực, trình độ AI, giờ đăng ký
- **Làm gì:** đọc bảng `customers` với `source = 'course-form'`
- **Tình huống:** biết ai vừa điền form để chủ động gọi/nhắn tư vấn
- **Câu nhắn Telegram ví dụ:**
  - "Ai mới điền form hôm nay?"
  - "3 ngày qua có bao nhiêu người đăng ký khoá học?"
  - "Cho xem 5 người đăng ký gần nhất"

---

## Nguyên tắc an toàn

- MCP chỉ gắn cho **agent quản trị riêng** (Telegram của chủ), KHÔNG gắn cho agent tư vấn công khai trên website.
- MCP không mở ra internet: container chỉ nằm trong mạng Docker nội bộ với goClaw, bắt buộc Bearer token.
- SĐT / email luôn được che bớt trước khi trả về (dữ liệu đi qua Telegram và nhà cung cấp LLM).
