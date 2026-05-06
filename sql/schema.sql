-- ============================================================
-- 1. profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own"   on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own"   on public.profiles for insert with check (auth.uid() = id);

-- admin can view all profiles
create policy "profiles_select_admin" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 2. trigger: auto-insert profile on sign-up
--    admin@admin.com → role = 'admin'
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = 'admin@admin.com' then 'admin' else 'user' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. products
-- ============================================================
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price integer not null,
  image_url text,
  stock integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "products_select_all"   on public.products for select using (true);
create policy "products_insert_admin" on public.products for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "products_update_admin" on public.products for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "products_delete_admin" on public.products for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- 4. orders
-- ============================================================
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  user_email text,
  status text default 'pending' check (status in ('pending','paid','cancelled','failed')),
  total_amount integer not null,
  toss_payment_key text,
  toss_order_id text unique,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "orders_select_own"    on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own"    on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_select_admin"  on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
-- service role (Edge Function) updates status
create policy "orders_update_service" on public.orders for update using (true);

-- ============================================================
-- 5. order_items
-- ============================================================
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade,
  product_id uuid references public.products,
  product_name text not null,
  quantity integer not null,
  price integer not null
);

alter table public.order_items enable row level security;

create policy "order_items_select_own" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "order_items_insert_own" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "order_items_select_admin" on public.order_items for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
