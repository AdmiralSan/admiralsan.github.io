# Supabase Schema Setup Instructions

This document explains how to set up the database schema for VsdvBillsoft in your Supabase project.

## Prerequisites

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Note down your Supabase URL and anon key (you'll need these for the application)

## Setting Up the Schema

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase project
2. Navigate to the SQL Editor
3. Create a new query
4. Copy the entire contents of `schema.sql` into the SQL editor
5. Click "Run" to execute the SQL

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push --db-url "your-supabase-connection-string" schema.sql
```

## Setting Up Storage Buckets

The application uses Supabase Storage for product images. You need to create a storage bucket:

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name it `product-images`
4. Set the access level to "Private" (access will be controlled through policies)

## Configure Storage Policies

After creating the bucket, add these storage policies:

1. Go to Storage > Policies
2. For the `product-images` bucket, add these policies:

### Select (Download) Policy:
- Name: "Anyone can download product images"
- Policy: `true`
- This allows public access to the images

### Insert Policy:
- Name: "Authenticated users can upload product images"
- Policy: `auth.role() = 'authenticated'`

### Update Policy:
- Name: "Authenticated users can update their uploads"
- Policy: `auth.role() = 'authenticated'`

### Delete Policy:
- Name: "Authenticated users can delete product images"
- Policy: `auth.role() = 'authenticated'`

## Application Connection

Make sure your Supabase client in the application is configured with your project URL and anon key:

```javascript
// In src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Seeding Initial Data (Optional)

You can run the following SQL to add some initial data:

```sql
-- Add sample suppliers
INSERT INTO public.suppliers (name, email, phone, address, contact_person)
VALUES
  ('Tech Supplies Inc.', 'contact@techsupplies.com', '555-1234', '123 Tech St, San Francisco, CA', 'John Smith'),
  ('Global Electronics', 'info@globalelectronics.com', '555-5678', '456 Global Ave, New York, NY', 'Sarah Johnson'),
  ('Food Distributors Ltd.', 'orders@fooddist.com', '555-9012', '789 Food Blvd, Chicago, IL', 'Michael Brown');

-- Add sample products
INSERT INTO public.products (name, sku, description, price, quantity, category, supplier_id, reorder_level)
VALUES
  ('Smartphone X', 'PHONE-X', 'Latest smartphone model with high-end features', 999.99, 50, 'electronics', (SELECT id FROM suppliers WHERE name = 'Global Electronics'), 10),
  ('Laptop Pro', 'LAP-PRO', '15-inch professional laptop with 16GB RAM', 1299.99, 25, 'electronics', (SELECT id FROM suppliers WHERE name = 'Tech Supplies Inc.'), 5),
  ('Organic Apples', 'APPLE-ORG', 'Fresh organic apples, 1kg pack', 3.99, 100, 'food', (SELECT id FROM suppliers WHERE name = 'Food Distributors Ltd.'), 20);
```

## Next Steps

Once the schema is set up, you can:

1. Configure authentication in Supabase (if needed)
2. Add more sample data
3. Adjust the Row Level Security (RLS) policies to match your specific requirements
