create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  is_available boolean not null default true,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  status text not null default 'novo' check (status in ('novo', 'aceito', 'preparando', 'pronto', 'saiu_para_entrega', 'finalizado', 'cancelado')),
  fulfillment_type text not null check (fulfillment_type in ('retirada', 'entrega')),
  customer_name text not null,
  customer_phone text not null,
  delivery_address text,
  neighborhood text,
  notes text,
  payment_method text not null check (payment_method in ('dinheiro', 'cartao', 'pix')),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  whatsapp_message text not null default '',
  source text not null default 'web',
  confirmed_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('entrada_manual', 'saida_manual', 'ajuste', 'saida_venda', 'reversao_venda')),
  quantity integer not null check (quantity > 0),
  reason text,
  order_id uuid references public.orders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  movement_type text not null check (movement_type in ('entrada_pedido', 'entrada_manual', 'saida_despesa', 'fechamento')),
  amount numeric(10, 2) not null check (amount >= 0),
  payment_method text check (payment_method in ('dinheiro', 'cartao', 'pix') or payment_method is null),
  description text,
  order_id uuid references public.orders(id) on delete set null,
  movement_date date not null default (timezone('America/Sao_Paulo', now()))::date,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null,
  whatsapp_number text not null,
  pix_key text,
  delivery_fee numeric(10, 2) not null default 0,
  minimum_order numeric(10, 2) not null default 0,
  is_store_open boolean not null default true,
  opening_hours text not null default '',
  kiosk_city text not null default 'Águas da Prata',
  delivery_city text not null default 'Poços de Caldas',
  brand_tagline text not null default '',
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_order_code()
returns trigger
language plpgsql
as $$
begin
  if new.order_code is null or new.order_code = '' then
    new.order_code = 'DS-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
  end if;

  return new;
end;
$$;

create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  accepted_statuses constant text[] := array['aceito', 'preparando', 'pronto', 'saiu_para_entrega', 'finalizado'];
begin
  if new.status = any(accepted_statuses) and not (old.status = any(accepted_statuses)) then
    new.confirmed_at = coalesce(new.confirmed_at, timezone('utc', now()));

    if not exists (
      select 1
      from public.stock_movements
      where order_id = new.id
        and movement_type = 'saida_venda'
    ) then
      for item in
        select product_id, quantity
        from public.order_items
        where order_id = new.id
          and product_id is not null
      loop
        update public.products
        set stock_quantity = greatest(stock_quantity - item.quantity, 0)
        where id = item.product_id;

        insert into public.stock_movements (product_id, movement_type, quantity, reason, order_id)
        values (item.product_id, 'saida_venda', item.quantity, 'Baixa automática por confirmação do pedido', new.id);
      end loop;
    end if;
  end if;

  if new.status = 'cancelado' and old.status = any(accepted_statuses) then
    if exists (
      select 1
      from public.stock_movements
      where order_id = new.id
        and movement_type = 'saida_venda'
    ) and not exists (
      select 1
      from public.stock_movements
      where order_id = new.id
        and movement_type = 'reversao_venda'
    ) then
      for item in
        select product_id, quantity
        from public.order_items
        where order_id = new.id
          and product_id is not null
      loop
        update public.products
        set stock_quantity = stock_quantity + item.quantity
        where id = item.product_id;

        insert into public.stock_movements (product_id, movement_type, quantity, reason, order_id)
        values (item.product_id, 'reversao_venda', item.quantity, 'Reversão automática por cancelamento', new.id);
      end loop;
    end if;
  end if;

  if new.status = 'finalizado' and old.status <> 'finalizado' then
    new.finalized_at = coalesce(new.finalized_at, timezone('utc', now()));

    if not exists (
      select 1
      from public.cash_movements
      where order_id = new.id
        and movement_type = 'entrada_pedido'
    ) then
      insert into public.cash_movements (movement_type, amount, payment_method, description, order_id)
      values ('entrada_pedido', new.total, new.payment_method, 'Entrada automática por pedido finalizado', new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists orders_set_code on public.orders;
create trigger orders_set_code
before insert on public.orders
for each row
execute function public.set_order_code();

drop trigger if exists orders_status_side_effects on public.orders;
create trigger orders_status_side_effects
before update of status on public.orders
for each row
execute function public.handle_order_status_change();

create index if not exists idx_categories_sort_order on public.categories(sort_order);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_display_order on public.products(display_order);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_stock_movements_product_id on public.stock_movements(product_id);
create index if not exists idx_cash_movements_movement_date on public.cash_movements(movement_date desc);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.cash_movements enable row level security;
alter table public.settings enable row level security;

create policy "public read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy "admin manage categories"
on public.categories
for all
to authenticated
using (true)
with check (true);

create policy "public read available products"
on public.products
for select
to anon, authenticated
using (is_active = true and is_available = true);

create policy "admin manage products"
on public.products
for all
to authenticated
using (true)
with check (true);

create policy "public read settings"
on public.settings
for select
to anon, authenticated
using (true);

create policy "admin manage settings"
on public.settings
for all
to authenticated
using (true)
with check (true);

create policy "public create orders"
on public.orders
for insert
to anon, authenticated
with check (status = 'novo' and source = 'web');

create policy "admin manage orders"
on public.orders
for all
to authenticated
using (true)
with check (true);

create policy "public create order items"
on public.order_items
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.orders
    where id = order_id
      and status = 'novo'
  )
);

create policy "admin manage order items"
on public.order_items
for all
to authenticated
using (true)
with check (true);

create policy "admin manage stock movements"
on public.stock_movements
for all
to authenticated
using (true)
with check (true);

create policy "admin manage cash movements"
on public.cash_movements
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

create policy "authenticated upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "authenticated update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "authenticated delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');
