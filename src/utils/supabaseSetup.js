import { supabase } from '../supabaseClient';

/**
 * Runs the database schema SQL to set up the Supabase database
 * This should be run once when initializing a new Supabase project
 * 
 * @returns {Promise<Object>} - Result of the setup operation
 */
export const setupSupabaseSchema = async () => {
  try {
    console.log('Setting up Supabase database schema...');
    
    // We'll run the SQL in chunks to handle size limits
    
    // 1. Create tables for users and suppliers
    const usersSuppliersSetup = `
      -- Users table (leveraging Supabase Auth)
      create table if not exists public.users (
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
      create table if not exists public.suppliers (
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
    `;
    
    // 2. Create tables for products and variants
    const productsVariantsSetup = `
      -- Products table
      create table if not exists public.products (
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
      create table if not exists public.product_variants (
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
    `;
    
    // 3. Create tables for images and stock movements
    const imagesStockSetup = `
      -- Product images
      create table if not exists public.product_images (
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
      create table if not exists public.stock_movements (
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
    `;
    
    // 4. Create tables for batches and purchase orders
    const batchesOrdersSetup = `
      -- Product batches for expiry tracking
      create table if not exists public.product_batches (
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
      create table if not exists public.purchase_orders (
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
      create table if not exists public.order_items (
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
    `;
    
    // 5. Create functions and triggers
    const functionsTriggersSetup = `
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
      drop trigger if exists update_product_quantity_on_variant_change on public.product_variants;
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
      drop trigger if exists update_products_timestamp on public.products;
      create trigger update_products_timestamp
      before update on public.products
      for each row
      execute function update_timestamp();

      drop trigger if exists update_suppliers_timestamp on public.suppliers;
      create trigger update_suppliers_timestamp
      before update on public.suppliers
      for each row
      execute function update_timestamp();

      drop trigger if exists update_product_variants_timestamp on public.product_variants;
      create trigger update_product_variants_timestamp
      before update on public.product_variants
      for each row
      execute function update_timestamp();

      drop trigger if exists update_product_batches_timestamp on public.product_batches;
      create trigger update_product_batches_timestamp
      before update on public.product_batches
      for each row
      execute function update_timestamp();

      drop trigger if exists update_purchase_orders_timestamp on public.purchase_orders;
      create trigger update_purchase_orders_timestamp
      before update on public.purchase_orders
      for each row
      execute function update_timestamp();
    `;
    
    // 6. Create indexes
    const indexesSetup = `
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
    `;
    
    // 7. Function for batch transfers
    const batchTransferFunction = `
      -- Function to transfer stock between batches
      create or replace function transfer_batch_stock(
        from_batch_id uuid,
        to_batch_id uuid,
        transfer_quantity integer,
        transfer_notes text
      )
      returns json
      language plpgsql
      security definer
      as $$
      declare
        source_batch record;
        dest_batch record;
        product_id_var uuid;
        variant_id_var uuid;
      begin
        -- Get source batch
        select * into source_batch from product_batches where id = from_batch_id;
        if not found then
          return json_build_object('success', false, 'message', 'Source batch not found');
        end if;
        
        -- Check if source has enough quantity
        if source_batch.quantity < transfer_quantity then
          return json_build_object('success', false, 'message', 'Not enough quantity in source batch');
        end if;
        
        product_id_var := source_batch.product_id;
        variant_id_var := source_batch.variant_id;
        
        -- Update source batch
        update product_batches
        set quantity = quantity - transfer_quantity
        where id = from_batch_id;
        
        -- If destination batch is specified, update it
        if to_batch_id is not null then
          select * into dest_batch from product_batches where id = to_batch_id;
          
          if not found then
            return json_build_object('success', false, 'message', 'Destination batch not found');
          end if;
          
          -- Ensure batches are for the same product
          if dest_batch.product_id != product_id_var then
            return json_build_object('success', false, 'message', 'Cannot transfer between different products');
          end if;
          
          -- Update destination batch
          update product_batches
          set quantity = quantity + transfer_quantity
          where id = to_batch_id;
          
          -- Record stock movement as transfer
          insert into stock_movements (
            product_id, 
            variant_id,
            quantity, 
            movement_type, 
            reference_number,
            notes
          ) values (
            product_id_var,
            variant_id_var,
            transfer_quantity,
            'transfer',
            'BATCH-TRANSFER-' || from_batch_id || '-TO-' || to_batch_id,
            transfer_notes
          );
        else
          -- No destination batch - this is a reduction/adjustment
          insert into stock_movements (
            product_id, 
            variant_id,
            quantity, 
            movement_type, 
            reference_number,
            notes
          ) values (
            product_id_var,
            variant_id_var,
            transfer_quantity,
            'adjustment',
            'BATCH-ADJUST-' || from_batch_id,
            transfer_notes
          );
        end if;
        
        return json_build_object('success', true);
      end;
      $$;
    `;
    
    // Execute each setup chunk
    await supabase.rpc('pgexec', { cmd: usersSuppliersSetup });
    await supabase.rpc('pgexec', { cmd: productsVariantsSetup });
    await supabase.rpc('pgexec', { cmd: imagesStockSetup });
    await supabase.rpc('pgexec', { cmd: batchesOrdersSetup });
    await supabase.rpc('pgexec', { cmd: functionsTriggersSetup });
    await supabase.rpc('pgexec', { cmd: indexesSetup });
    await supabase.rpc('pgexec', { cmd: batchTransferFunction });
    
    console.log('Database schema setup completed successfully!');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting up database schema:', error);
    return { success: false, error };
  }
};

/**
 * Creates Supabase storage buckets needed for the application
 * 
 * @returns {Promise<Object>} - Result of the storage setup operation
 */
export const setupSupabaseStorage = async () => {
  try {
    console.log('Setting up Supabase storage...');
    
    // Create product images bucket
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .createBucket('product-images', {
        public: false,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        fileSizeLimit: 2097152 // 2MB
      });
    
    if (bucketError && bucketError.message !== 'Bucket already exists') {
      throw bucketError;
    }
    
    // Set up bucket policies
    // These need to be set through SQL in Supabase
    const storagePolicies = `
      -- Allow anyone to download images
      create policy "Anyone can download product images"
      on storage.objects for select
      using (bucket_id = 'product-images');
      
      -- Allow authenticated users to upload images
      create policy "Authenticated users can upload product images"
      on storage.objects for insert
      with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
      
      -- Allow authenticated users to update their images
      create policy "Authenticated users can update product images"
      on storage.objects for update
      using (bucket_id = 'product-images' and auth.role() = 'authenticated');
      
      -- Allow authenticated users to delete images
      create policy "Authenticated users can delete product images"
      on storage.objects for delete
      using (bucket_id = 'product-images' and auth.role() = 'authenticated');
    `;
    
    await supabase.rpc('pgexec', { cmd: storagePolicies });
    
    console.log('Storage setup completed successfully!');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting up storage:', error);
    return { success: false, error };
  }
};

/**
 * Check if the Supabase schema is properly set up
 * 
 * @returns {Promise<Object>} - Result of the verification
 */
export const verifySupabaseSetup = async () => {
  try {
    console.log('Verifying Supabase setup...');
    
    // Check if tables exist
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('pgexec', {
        cmd: `
          select table_name 
          from information_schema.tables 
          where table_schema = 'public' and
          table_name in ('users', 'suppliers', 'products', 'product_variants',
                         'product_images', 'stock_movements', 'product_batches',
                         'purchase_orders', 'order_items');
        `
      });
    
    if (tablesError) throw tablesError;
    
    // Check storage buckets
    const { data: bucketsData, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) throw bucketsError;
    
    const productImagesBucket = bucketsData.find(bucket => bucket.name === 'product-images');
    
    return {
      success: true,
      tables: tablesData,
      buckets: bucketsData,
      isComplete: tablesData.length === 9 && productImagesBucket !== undefined,
      error: null
    };
  } catch (error) {
    console.error('Error verifying setup:', error);
    return { success: false, error };
  }
};
