-- Day 15: cờ "đã nhắn" cho heartbeat agent goClaw (tool MCP tin_hieu_moi) — không nhắn trùng 1 đơn/1 khách 2 lần.
alter table public.orders    add column if not exists notified_at timestamptz;
alter table public.customers add column if not exists notified_at timestamptz;

-- Dữ liệu cũ coi như đã nhắn, kẻo nhịp tim đầu tiên báo lại toàn bộ.
-- Đơn pending giữ null: khi nào thanh toán thành công thì vẫn được báo.
update public.orders    set notified_at = now() where notified_at is null and status <> 'pending';
update public.customers set notified_at = now() where notified_at is null;

create index if not exists orders_unnotified_idx    on public.orders(id)    where notified_at is null;
create index if not exists customers_unnotified_idx on public.customers(id) where notified_at is null;
