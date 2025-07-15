-- VsdvBillsoft Database Schema for Supabase

-- Users table (leveraging Supabase Auth)
-- This references the auth.users table created by Supabase Auth
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own user data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own user data" on public.users
  for update using (auth.uid() = id);

-- Suppliers table
create table public.suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  contact_person text,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid references public.users(id)
);

-- Enable Row Level Security
alter table public.suppliers enable row level security;

-- Create policies
create policy "Authenticated users can view suppliers" on public.suppliers
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert suppliers" on public.suppliers
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update suppliers" on public.suppliers
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete suppliers" on public.suppliers
  for delete using (auth.role() = 'authenticated');

-- Products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sku text unique,
  description text,
  price decimal(10,2) not null default 0,
  quantity integer not null default 0,
  category text,
  supplier_id uuid references public.suppliers(id),
  reorder_level integer default 0,
  is_perishable boolean default false,
  has_expiry boolean default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid references public.users(id)
);

-- Enable Row Level Security
alter table public.products enable row level security;

-- Create policies
create policy "Authenticated users can view products" on public.products
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert products" on public.products
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update products" on public.products
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete products" on public.products
  for delete using (auth.role() = 'authenticated');

-- Product variants
create table public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  attribute_name text not null, -- e.g., 'Size', 'Color'
  value text not null, -- e.g., 'XL', 'Blue'
  sku text,
  price_adjustment decimal(10,2) default 0, -- +/- from base price
  stock integer default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(product_id, attribute_name, value)
);

-- Enable Row Level Security
alter table public.product_variants enable row level security;

-- Create policies
create policy "Authenticated users can view product variants" on public.product_variants
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert product variants" on public.product_variants
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update product variants" on public.product_variants
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete product variants" on public.product_variants
  for delete using (auth.role() = 'authenticated');

-- Product images
create table public.product_images (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  url text not null,
  path text not null, -- Storage path for deletion
  alt_text text,
  is_primary boolean default false,
  display_order integer default 0,
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.product_images enable row level security;

-- Create policies
create policy "Authenticated users can view product images" on public.product_images
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert product images" on public.product_images
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update product images" on public.product_images
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete product images" on public.product_images
  for delete using (auth.role() = 'authenticated');

-- Stock movements
create table public.stock_movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  variant_id uuid references public.product_variants(id),
  quantity integer not null,
  movement_type text not null check (movement_type in ('incoming', 'outgoing', 'adjustment', 'transfer')),
  reference_number text, -- e.g., order number, invoice number
  notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.stock_movements enable row level security;

-- Create policies
create policy "Authenticated users can view stock movements" on public.stock_movements
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert stock movements" on public.stock_movements
  for insert with check (auth.role() = 'authenticated');

-- Product batches for expiry tracking
create table public.product_batches (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  variant_id uuid references public.product_variants(id),
  batch_number text not null,
  quantity integer not null default 0,
  manufacturing_date date,
  expiry_date date not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.product_batches enable row level security;

-- Create policies
create policy "Authenticated users can view product batches" on public.product_batches
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert product batches" on public.product_batches
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update product batches" on public.product_batches
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete product batches" on public.product_batches
  for delete using (auth.role() = 'authenticated');

-- Purchase orders for automated reordering
create table public.purchase_orders (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) not null,
  order_number text unique not null,
  order_date date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'ordered', 'received', 'cancelled')),
  expected_delivery_date date,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.purchase_orders enable row level security;

-- Create policies
create policy "Authenticated users can view purchase orders" on public.purchase_orders
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert purchase orders" on public.purchase_orders
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update purchase orders" on public.purchase_orders
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete purchase orders" on public.purchase_orders
  for delete using (auth.role() = 'authenticated');

-- Order items for purchase orders
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  purchase_order_id uuid references public.purchase_orders(id) not null,
  product_id uuid references public.products(id) not null,
  variant_id uuid references public.product_variants(id),
  quantity integer not null,
  unit_price decimal(10,2) not null,
  notes text,
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.order_items enable row level security;

-- Create policies
create policy "Authenticated users can view order items" on public.order_items
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert order items" on public.order_items
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update order items" on public.order_items
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete order items" on public.order_items
  for delete using (auth.role() = 'authenticated');

-- Create functions and triggers

-- Function to update product quantity when variant stock changes
create or replace function update_product_quantity_from_variants()
returns trigger as $$
begin
  update public.products
  set 
    quantity = (
      select coalesce(sum(stock), 0)
      from public.product_variants
      where product_id = new.product_id
    ),
    updated_at = now()
  where id = new.product_id;
  return new;
end;
$$ language plpgsql;

-- Trigger for when variants are added, updated, or deleted
create trigger update_product_quantity_on_variant_change
after insert or update of stock or delete
on public.product_variants
for each row
execute function update_product_quantity_from_variants();

-- Function to update updated_at timestamp
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables with that column
create trigger update_products_timestamp
before update on public.products
for each row
execute function update_timestamp();

create trigger update_suppliers_timestamp
before update on public.suppliers
for each row
execute function update_timestamp();

create trigger update_product_variants_timestamp
before update on public.product_variants
for each row
execute function update_timestamp();

create trigger update_product_batches_timestamp
before update on public.product_batches
for each row
execute function update_timestamp();

create trigger update_purchase_orders_timestamp
before update on public.purchase_orders
for each row
execute function update_timestamp();

-- Create indexes for performance
create index if not exists products_supplier_id_idx on public.products(supplier_id);
create index if not exists products_category_idx on public.products(category);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists stock_movements_product_id_idx on public.stock_movements(product_id);
create index if not exists product_batches_product_id_idx on public.product_batches(product_id);
create index if not exists product_batches_expiry_date_idx on public.product_batches(expiry_date);
create index if not exists purchase_orders_supplier_id_idx on public.purchase_orders(supplier_id);
create index if not exists order_items_purchase_order_id_idx on public.order_items(purchase_order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
