-- Day 11: tiến độ chuỗi email chăm sóc cho từng khách.
-- seq_step = số email đã gửi (0-3), seq_next_at = lúc gửi email kế tiếp, null khi đã xong chuỗi.
alter table public.customers
  add column if not exists seq_step    smallint not null default 0 check (seq_step between 0 and 3),
  add column if not exists seq_next_at timestamptz;

create index if not exists customers_seq_due_idx on public.customers(seq_next_at) where seq_step between 1 and 2;
