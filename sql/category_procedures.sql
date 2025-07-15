-- Create the categories table if it doesn't exist
create or replace function create_categories_table()
returns void
language plpgsql
as $$
begin
  -- Check if the categories table exists
  if not exists (
    select from pg_tables 
    where schemaname = 'public' 
    and tablename = 'categories'
  ) then
    -- Create the categories table
    create table public.categories (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      description text,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );

    -- Create an index on the name column
    create index if not exists categories_name_idx on public.categories(name);
    
    -- Add RLS policies
    alter table public.categories enable row level security;
    
    -- Everyone can read categories
    create policy "Anyone can view categories" 
      on public.categories for select 
      using (true);
      
    -- Anyone can create/update/delete categories
    create policy "Anyone can insert categories" 
      on public.categories for insert 
      with check (true);
      
    create policy "Anyone can update categories" 
      on public.categories for update 
      using (true);
      
    create policy "Anyone can delete categories" 
      on public.categories for delete 
      using (true);
  end if;
end;
$$;

-- Add category_id to products table if it doesn't exist
create or replace function add_category_id_to_products()
returns void
language plpgsql
as $$
begin
  -- Check if the category_id column exists in the products table
  if not exists (
    select from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'products' 
    and column_name = 'category_id'
  ) then
    -- Add category_id column to products table
    alter table public.products add column category_id uuid references public.categories(id);
    
    -- Create an index on the category_id column
    create index if not exists products_category_id_idx on public.products(category_id);
  end if;
end;
$$;

-- Migrate existing categories to the new table
create or replace function migrate_existing_categories()
returns void
language plpgsql
as $$
declare
  category_name text;
  new_category_id uuid;
begin
  -- Get distinct categories from products
  for category_name in 
    select distinct category from public.products 
    where category is not null and category != ''
  loop
    -- Check if category exists in categories table
    if not exists (
      select from public.categories where name = category_name
    ) then
      -- Insert new category
      insert into public.categories (name) 
      values (category_name)
      returning id into new_category_id;
      
      -- Update products with the new category_id
      update public.products 
      set category_id = new_category_id 
      where category = category_name;
    else
      -- Category already exists, get its ID
      select id into new_category_id 
      from public.categories 
      where name = category_name;
      
      -- Update products with the existing category_id
      update public.products 
      set category_id = new_category_id 
      where category = category_name;
    end if;
  end loop;
end;
$$;

-- Create a function that combines all of the above
create or replace function create_category_procedures()
returns void
language plpgsql
as $$
begin
  -- Create categories table
  perform create_categories_table();
  
  -- Add category_id to products
  perform add_category_id_to_products();
  
  -- Migrate existing categories
  perform migrate_existing_categories();
end;
$$;