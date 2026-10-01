-- Nội dung landing chỉnh được từ xa (MCP / Telegram) mà không cần deploy lại.
-- Chỉ server (service_role) đọc/ghi; khách đọc qua /api/settings với danh sách key cho phép.
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.site_settings enable row level security;

-- Giá trị mặc định = nội dung đang có trong index.html.
insert into public.site_settings (key, value, updated_by) values
  ('hero_title_1', 'Tôi xây hệ thống giúp doanh nghiệp', 'seed'),
  ('hero_title_2', 'kéo khách bằng AI.', 'seed')
on conflict (key) do nothing;
