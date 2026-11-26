-- Grama Joyería — Esquema inicial para Supabase (PostgreSQL + RLS + Storage)
-- Preparado para catálogo público, panel admin compartido, trazabilidad entre socios y futuro módulo mayorista.

create extension if not exists pgcrypto;

-- Helper para verificar si el usuario autenticado es un socio habilitado
create or replace function public.is_active_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
  );
$$;

-- Trigger helper para actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Perfiles de socios / vendedores
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  seller_slug text not null unique check (seller_slug ~ '^[a-z0-9-]+$'),
  whatsapp_number text not null default '',
  role text not null default 'partner' check (role in ('owner', 'partner')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 2. Configuración general de la tienda (singleton id = 1)
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'Grama Joyería',
  instagram_handle text not null default '@gramajoyeria',
  contact_email text not null default '',
  default_seller_slug text not null default 'gonzalo',
  shipping_methods jsonb not null default '[]'::jsonb,
  wholesale_enabled boolean not null default false,
  wholesale_min_order_cents integer not null default 0 check (wholesale_min_order_cents >= 0),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create trigger trg_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

insert into public.store_settings (id, business_name, shipping_methods)
values (
  1,
  'Grama Joyería',
  '[
    {"id": "pickup", "title": "Retiro en punto de entrega", "description": "Sin costo, coordinando día y horario tras confirmar tu pedido."},
    {"id": "courier", "title": "Envío por cadetería / moto", "description": "Entregas rápidas dentro de zona de cobertura."},
    {"id": "mail", "title": "Correo a todo el país", "description": "Despacho con código de seguimiento y packaging protector."}
  ]'::jsonb
)
on conflict (id) do nothing;

-- 3. Categorías de accesorios
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Productos / Joyas (incluye campos base para futura lista mayorista)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '',
  material_details text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  cost_cents integer not null default 0 check (cost_cents >= 0),
  retail_price_cents integer not null check (retail_price_cents >= 0),
  wholesale_price_cents integer check (wholesale_price_cents is null or wholesale_price_cents >= 0),
  wholesale_min_qty integer check (wholesale_min_qty is null or wholesale_min_qty > 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  min_stock_qty integer not null default 2 check (min_stock_qty >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_low_stock on public.products(stock_qty, min_stock_qty) where is_active = true;

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- 5. Imágenes de productos
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images(product_id, sort_order);

-- 6. Pedidos y ventas
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  source text not null default 'catalog' check (source in ('catalog', 'manual')),
  seller_slug text not null,
  assigned_profile_id uuid references public.profiles(id),
  customer_name text not null,
  customer_phone text not null default '',
  delivery_method text not null default '',
  delivery_address text not null default '',
  payment_method text not null default '',
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  total_cents integer not null default 0 check (total_cents >= 0),
  created_by uuid references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status_created on public.orders(status, created_at desc);

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- 7. Ítems de cada pedido / venta
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0)
);

-- 8. Gastos y reinversiones
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('inventory', 'packaging', 'shipping', 'marketing', 'other')),
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  expense_date date not null default current_date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses(expense_date desc);

-- 9. Historial de actividad compartida entre socios
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_name text not null,
  action_type text not null,
  summary text not null,
  entity_type text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);

-- Vistas públicas seguras (ocultan costos internos y datos privados de perfiles)
create or replace view public.public_sellers as
select
  full_name,
  seller_slug,
  whatsapp_number
from public.profiles
where is_active = true;

create or replace view public.public_catalog_products as
select
  p.id,
  p.name,
  p.slug,
  p.description,
  p.material_details,
  p.category_id,
  p.retail_price_cents,
  p.stock_qty,
  p.min_stock_qty,
  p.created_at
from public.products p
where p.is_active = true;

-- RLS
alter table public.profiles enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.expenses enable row level security;
alter table public.activity_logs enable row level security;

-- Políticas para socios autenticados
create policy "Partners read profiles"
on public.profiles for select to authenticated
using (public.is_active_partner());

create policy "Partners update profiles"
on public.profiles for update to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Public reads store settings"
on public.store_settings for select to anon, authenticated
using (true);

create policy "Partners update store settings"
on public.store_settings for update to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Public reads active categories"
on public.categories for select to anon, authenticated
using (is_active = true or public.is_active_partner());

create policy "Partners manage categories"
on public.categories for all to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Partners manage products"
on public.products for all to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Public reads product images"
on public.product_images for select to anon, authenticated
using (true);

create policy "Partners manage product images"
on public.product_images for all to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Partners manage orders"
on public.orders for all to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Partners manage order items"
on public.order_items for all to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Partners manage expenses"
on public.expenses for all to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

create policy "Partners manage activity logs"
on public.activity_logs for all to authenticated
using (public.is_active_partner())
with check (public.is_active_partner());

grant select on public.public_sellers to anon, authenticated;
grant select on public.public_catalog_products to anon, authenticated;

-- Bucket de Storage para fotos de accesorios
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public reads product photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

create policy "Partners upload product photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_active_partner());

create policy "Partners delete product photos"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_active_partner());
