-- Day 10: CRM bán hàng (products, customers, orders) + log giao dịch Sepay.
-- Mọi truy cập đi qua Vercel Functions bằng service_role, nên bật RLS và không mở policy public.

create table public.products (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  name        text not null,
  type        text not null check (type in ('physical', 'digital', 'service')),
  price       integer not null check (price >= 0),
  description text,
  stock       integer check (stock is null or stock >= 0),  -- chỉ dùng cho physical
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint physical_needs_stock check (type <> 'physical' or stock is not null)
);

create table public.customers (
  id             bigint generated always as identity primary key,
  name           text not null,
  phone          text unique not null,
  zalo           text,
  email          text,
  current_status text,
  major          text,
  niche          text,
  paid_before    text,
  ai_level       text,
  note           text,
  source         text not null default 'form',
  created_at     timestamptz not null default now()
);

create table public.orders (
  id           bigint generated always as identity primary key,
  code         text unique not null,
  customer_id  bigint not null references public.customers(id) on delete restrict,
  product_id   bigint not null references public.products(id) on delete restrict,
  quantity     integer not null default 1 check (quantity > 0),
  amount       integer not null check (amount >= 0),
  status       text not null default 'pending' check (status in ('pending', 'success', 'cancelled')),
  paid_via     text check (paid_via in ('sepay', 'manual')),
  sepay_tx_id  bigint,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index orders_status_idx on public.orders(status);

create table public.sepay_transactions (
  id               bigint primary key,           -- id giao dịch của Sepay, chống xử lý trùng khi retry
  gateway          text,
  transaction_date text,
  account_number   text,
  code             text,
  content          text,
  transfer_type    text,
  transfer_amount  integer,
  reference_code   text,
  order_id         bigint references public.orders(id) on delete set null,
  raw              jsonb not null,
  received_at      timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.sepay_transactions enable row level security;

-- Tạo đơn: sinh mã thanh toán, chốt giá theo sản phẩm, chỉ trừ tồn kho với hàng vật lý.
create or replace function public.create_order(p_customer_id bigint, p_product_id bigint, p_quantity integer default 1)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_order   public.orders;
  v_code    text;
  v_chars   constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;

  if v_product.type = 'physical' then
    if v_product.stock < p_quantity then raise exception 'OUT_OF_STOCK'; end if;
    update public.products set stock = stock - p_quantity where id = p_product_id;
  end if;

  loop
    v_code := 'AI21';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.orders where code = v_code);
  end loop;

  insert into public.orders (code, customer_id, product_id, quantity, amount)
  values (v_code, p_customer_id, p_product_id, p_quantity, v_product.price * p_quantity)
  returning * into v_order;
  return v_order;
end;
$$;

-- Hủy đơn hàng vật lý thì trả lại tồn kho.
create or replace function public.restock_on_cancel()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.products set stock = stock + old.quantity
    where id = old.product_id and type = 'physical';
  end if;
  return new;
end;
$$;

create trigger orders_restock_on_cancel
after update of status on public.orders
for each row execute function public.restock_on_cancel();

revoke execute on function public.create_order(bigint, bigint, integer) from public, anon, authenticated;

insert into public.products (slug, name, type, price, description, stock) values
  ('coc-founding', 'Cọc giữ chỗ Founding Cohort', 'service', 500000, 'Đặt cọc giữ 1 trong 3 suất Founding, trừ vào học phí 990.000đ.', null),
  ('founding', '21AISYSTEM Founding Cohort', 'service', 990000, 'Thử thách thực hành 21 ngày, 12/10 - 01/11/2026.', null);
