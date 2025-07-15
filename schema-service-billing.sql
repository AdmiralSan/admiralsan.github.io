-- Service and Billing System Schema for VsdvBillsoft

-- Customers table
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid references public.users(id)
);

-- Enable Row Level Security
alter table public.customers enable row level security;

-- Create policies
create policy "Authenticated users can view customers" on public.customers
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert customers" on public.customers
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update customers" on public.customers
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete customers" on public.customers
  for delete using (auth.role() = 'authenticated');

-- Bills/Invoices table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  invoice_number text not null unique,
  customer_id uuid references public.customers(id) not null,
  invoice_date timestamp with time zone default now() not null,
  total_amount decimal(12,2) not null,
  discount_amount decimal(10,2) default 0,
  tax_amount decimal(10,2) default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid', 'cancelled')),
  payment_method text,
  notes text,
  warranty_provided boolean default false,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.invoices enable row level security;

-- Create policies
create policy "Authenticated users can view invoices" on public.invoices
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert invoices" on public.invoices
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update invoices" on public.invoices
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete invoices" on public.invoices
  for delete using (auth.role() = 'authenticated');

-- Invoice items
create table public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) not null,
  product_id uuid references public.products(id) not null,
  variant_id uuid references public.product_variants(id),
  quantity integer not null,
  unit_price decimal(10,2) not null,
  discount_percent decimal(5,2) default 0,
  tax_percent decimal(5,2) default 0,
  serial_number text,
  warranty_months integer default 0,
  warranty_end_date date,
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.invoice_items enable row level security;

-- Create policies
create policy "Authenticated users can view invoice items" on public.invoice_items
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert invoice items" on public.invoice_items
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update invoice items" on public.invoice_items
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete invoice items" on public.invoice_items
  for delete using (auth.role() = 'authenticated');

-- Service records
create table public.service_records (
  id uuid default gen_random_uuid() primary key,
  service_number text not null unique,
  customer_id uuid references public.customers(id) not null,
  invoice_item_id uuid references public.invoice_items(id),
  product_id uuid references public.products(id) not null,
  serial_number text,
  issue_description text not null,
  diagnosis text,
  service_status text not null default 'received' check (service_status in ('received', 'diagnosed', 'in_progress', 'waiting_for_parts', 'completed', 'delivered', 'cancelled')),
  is_warranty_claim boolean default false,
  service_cost decimal(10,2) default 0,
  parts_cost decimal(10,2) default 0,
  total_cost decimal(10,2) default 0,
  received_date timestamp with time zone default now() not null,
  promised_date timestamp with time zone,
  completed_date timestamp with time zone,
  delivered_date timestamp with time zone,
  technician_notes text,
  customer_notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.service_records enable row level security;

-- Create policies
create policy "Authenticated users can view service records" on public.service_records
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert service records" on public.service_records
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update service records" on public.service_records
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete service records" on public.service_records
  for delete using (auth.role() = 'authenticated');

-- Service parts used
create table public.service_parts (
  id uuid default gen_random_uuid() primary key,
  service_record_id uuid references public.service_records(id) not null,
  product_id uuid references public.products(id) not null,
  variant_id uuid references public.product_variants(id),
  quantity integer not null,
  unit_price decimal(10,2) not null,
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.service_parts enable row level security;

-- Create policies
create policy "Authenticated users can view service parts" on public.service_parts
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert service parts" on public.service_parts
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update service parts" on public.service_parts
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete service parts" on public.service_parts
  for delete using (auth.role() = 'authenticated');

-- Function to update warranty end date based on warranty months
create or replace function calculate_warranty_end_date()
returns trigger as $$
begin
  if new.warranty_months > 0 then
    new.warranty_end_date := (select invoice_date from public.invoices where id = new.invoice_id) + (new.warranty_months * interval '1 month');
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger for when invoice items are created or warranty months updated
create trigger set_warranty_end_date
before insert or update of warranty_months
on public.invoice_items
for each row
execute function calculate_warranty_end_date();

-- Create indexes for performance
create index if not exists customers_name_idx on public.customers(name);
create index if not exists customers_phone_idx on public.customers(phone);
create index if not exists invoices_customer_id_idx on public.invoices(customer_id);
create index if not exists invoices_date_idx on public.invoices(invoice_date);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);
create index if not exists invoice_items_serial_number_idx on public.invoice_items(serial_number);
create index if not exists service_records_customer_id_idx on public.service_records(customer_id);
create index if not exists service_records_serial_number_idx on public.service_records(serial_number);
create index if not exists service_records_status_idx on public.service_records(service_status);
create index if not exists service_parts_service_record_id_idx on public.service_parts(service_record_id);