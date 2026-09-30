-- Vá tuân thủ: đồng ý nhận email, hủy đăng ký, giới hạn tần suất.
-- Khách cũ chưa có email_consent_at sẽ không nhận thêm email trong chuỗi (chưa có bằng chứng đồng ý).
alter table public.customers
  add column if not exists email_consent_at timestamptz,
  add column if not exists unsubscribed_at  timestamptz;

-- Bảng đếm sự kiện để giới hạn tần suất (đăng nhập admin sai, tạo đơn checkout). Cron dọn bản ghi cũ.
create table if not exists public.rate_events (
  id         bigint generated always as identity primary key,
  bucket     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_bucket_idx on public.rate_events(bucket, created_at);
alter table public.rate_events enable row level security;
