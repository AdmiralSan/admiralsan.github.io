-- VsdvBillsoft Database Schema Update for Notifications

-- Notifications table for system alerts
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'order_received', 'system')),
  message text not null,
  resource_type text, -- e.g., 'product', 'order', 'product_batch'
  resource_id uuid,   -- ID of the related resource
  user_id uuid references public.users(id), -- If null, notification is for all users
  is_read boolean default false,
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.notifications enable row level security;

-- Create policies
create policy "Users can view their own notifications or global notifications" on public.notifications
  for select using (auth.uid() = user_id OR user_id IS NULL);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Create indexes for notifications
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);
create index if not exists notifications_resource_type_resource_id_idx on public.notifications(resource_type, resource_id);

-- Function to check for low stock and create notifications
create or replace function check_product_stock()
returns trigger as $$
declare
  product_name text;
begin
  -- Get product name
  select name into product_name from products where id = new.id;
  
  -- Check if product is below reorder level
  if new.quantity < new.reorder_level and new.quantity > 0 then
    -- Insert low stock notification
    insert into notifications (
      type, 
      message, 
      resource_type, 
      resource_id
    ) values (
      'low_stock',
      'Low stock alert: ' || product_name || ' is below reorder level (' || new.quantity || '/' || new.reorder_level || ')',
      'product',
      new.id
    );
  end if;
  
  -- Check if product is out of stock
  if new.quantity = 0 then
    -- Insert out of stock notification
    insert into notifications (
      type, 
      message, 
      resource_type, 
      resource_id
    ) values (
      'out_of_stock',
      'Out of stock alert: ' || product_name || ' is out of stock',
      'product',
      new.id
    );
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger for product stock changes
drop trigger if exists check_product_stock_trigger on public.products;
create trigger check_product_stock_trigger
after update of quantity on public.products
for each row
when (old.quantity <> new.quantity)
execute function check_product_stock();

-- Function to check for expiring batches
create or replace function check_expiring_batches()
returns trigger as $$
declare
  product_name text;
begin
  -- Get product name
  select name into product_name from products where id = new.product_id;
  
  -- Check if batch is expiring within 7 days
  if new.expiry_date <= (current_date + interval '7 days') and new.expiry_date >= current_date then
    -- Insert expiring soon notification
    insert into notifications (
      type, 
      message, 
      resource_type, 
      resource_id
    ) values (
      'expiring_soon',
      'Expiry alert: ' || product_name || ' (Batch ' || new.batch_number || ') expires on ' || to_char(new.expiry_date, 'YYYY-MM-DD'),
      'product_batch',
      new.id
    );
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger for new batches or batch updates
drop trigger if exists check_expiring_batches_trigger on public.product_batches;
create trigger check_expiring_batches_trigger
after insert or update of expiry_date, quantity on public.product_batches
for each row
when (new.quantity > 0)
execute function check_expiring_batches();
