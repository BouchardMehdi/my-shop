-- Jalon 1: explicit privileges, even when automatic table exposure is disabled.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  image_url text not null,
  description text not null default '',
  category text not null default '',
  in_stock boolean not null default true,
  badge text,
  display_order integer not null default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1 check (quantity > 0)
);

create index orders_user_id_idx on public.orders(user_id);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on public.products, public.orders, public.order_items from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.products, public.orders, public.order_items to anon, authenticated;

create policy "products are public" on public.products
  for select to anon, authenticated using (true);

-- No order policies and no client write grants yet: all orders remain private.
-- The user-specific read/write policies will be introduced at milestone 3.
