-- VsdvBillsoft Database Schema Update for Warehouse Management

-- Warehouses table
create table public.warehouses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  contact_person text,
  phone text,
  email text,
  address text,
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid references public.users(id)
);

-- Enable Row Level Security
alter table public.warehouses enable row level security;

-- Create policies
create policy "Authenticated users can view warehouses" on public.warehouses
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert warehouses" on public.warehouses
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update warehouses" on public.warehouses
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete warehouses" on public.warehouses
  for delete using (auth.role() = 'authenticated');

-- Add warehouse_id to products table to track which warehouse a product is stored in
alter table public.products 
add column warehouse_id uuid references public.warehouses(id);

-- Add warehouse_id to product_variants table to track which warehouse a variant is stored in
alter table public.product_variants
add column warehouse_id uuid references public.warehouses(id);

-- Add warehouse_id to product_batches table to track which warehouse a batch is stored in
alter table public.product_batches
add column warehouse_id uuid references public.warehouses(id);

-- Update stock_movements table to track warehouse transfers
alter table public.stock_movements
add column source_warehouse_id uuid references public.warehouses(id),
add column target_warehouse_id uuid references public.warehouses(id);

-- Function to handle warehouse transfers
create or replace function transfer_between_warehouses(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer,
  p_source_warehouse_id uuid,
  p_target_warehouse_id uuid,
  p_notes text,
  p_reference_number text,
  p_user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_source_stock integer;
  v_success boolean := false;
  v_message text;
begin
  -- Check if product exists
  if not exists (select 1 from products where id = p_product_id) then
    return json_build_object('success', false, 'message', 'Product not found');
  end if;
  
  -- Check if warehouses exist
  if not exists (select 1 from warehouses where id = p_source_warehouse_id) then
    return json_build_object('success', false, 'message', 'Source warehouse not found');
  end if;
  
  if not exists (select 1 from warehouses where id = p_target_warehouse_id) then
    return json_build_object('success', false, 'message', 'Target warehouse not found');
  end if;
  
  -- Check if it's a variant or regular product
  if p_variant_id is not null then
    -- Get current stock in source warehouse for this variant
    select stock into v_source_stock
    from product_variants
    where id = p_variant_id and warehouse_id = p_source_warehouse_id;
    
    -- Check if enough stock
    if v_source_stock is null or v_source_stock < p_quantity then
      return json_build_object('success', false, 'message', 'Not enough stock in source warehouse');
    end if;
    
    -- Update source warehouse stock
    update product_variants
    set stock = stock - p_quantity
    where id = p_variant_id and warehouse_id = p_source_warehouse_id;
    
    -- Update or insert target warehouse stock
    if exists (select 1 from product_variants where id = p_variant_id and warehouse_id = p_target_warehouse_id) then
      -- Update existing variant in target warehouse
      update product_variants
      set stock = stock + p_quantity
      where id = p_variant_id and warehouse_id = p_target_warehouse_id;
    else
      -- Create a copy of the variant in the target warehouse
      insert into product_variants (
        product_id,
        attribute_name,
        value,
        sku,
        price_adjustment,
        stock,
        warehouse_id
      )
      select
        product_id,
        attribute_name,
        value,
        sku,
        price_adjustment,
        p_quantity,
        p_target_warehouse_id
      from product_variants
      where id = p_variant_id;
    end if;
    
    v_success := true;
  else
    -- Handle regular product (non-variant)
    -- Get current stock in source warehouse
    select quantity into v_source_stock
    from products
    where id = p_product_id and warehouse_id = p_source_warehouse_id;
    
    -- Check if enough stock
    if v_source_stock is null or v_source_stock < p_quantity then
      return json_build_object('success', false, 'message', 'Not enough stock in source warehouse');
    end if;
    
    -- Update source warehouse stock
    update products
    set quantity = quantity - p_quantity
    where id = p_product_id and warehouse_id = p_source_warehouse_id;
    
    -- Update or insert target warehouse stock
    if exists (select 1 from products where id = p_product_id and warehouse_id = p_target_warehouse_id) then
      -- Update existing product in target warehouse
      update products
      set quantity = quantity + p_quantity
      where id = p_product_id and warehouse_id = p_target_warehouse_id;
    else
      -- This is a complex case, we might need to split the product record
      -- For simplicity, we'll just update the warehouse_id if the product isn't in multiple warehouses yet
      if (select count(*) from products where id = p_product_id) = 1 then
        update products
        set warehouse_id = p_target_warehouse_id
        where id = p_product_id;
      end if;
    end if;
    
    v_success := true;
  end if;
  
  -- Record the transfer in stock_movements
  if v_success then
    insert into stock_movements (
      product_id,
      variant_id,
      quantity,
      movement_type,
      reference_number,
      notes,
      created_by,
      source_warehouse_id,
      target_warehouse_id
    ) values (
      p_product_id,
      p_variant_id,
      p_quantity,
      'transfer',
      p_reference_number,
      p_notes,
      p_user_id,
      p_source_warehouse_id,
      p_target_warehouse_id
    );
    
    return json_build_object('success', true, 'message', 'Transfer completed successfully');
  else
    return json_build_object('success', false, 'message', 'Transfer failed');
  end if;
end;
$$;

-- Create indexes for warehouse-related columns
create index if not exists products_warehouse_id_idx on public.products(warehouse_id);
create index if not exists product_variants_warehouse_id_idx on public.product_variants(warehouse_id);
create index if not exists product_batches_warehouse_id_idx on public.product_batches(warehouse_id);
create index if not exists stock_movements_source_warehouse_id_idx on public.stock_movements(source_warehouse_id);
create index if not exists stock_movements_target_warehouse_id_idx on public.stock_movements(target_warehouse_id);

-- Apply updated_at trigger to warehouses table
create trigger update_warehouses_timestamp
before update on public.warehouses
for each row
execute function update_timestamp();
