-- Remove authentication requirements for all operations

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can insert warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can update warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can delete warehouses" ON public.warehouses;

DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;

DROP POLICY IF EXISTS "Authenticated users can view product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can delete product variants" ON public.product_variants;

DROP POLICY IF EXISTS "Authenticated users can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON public.product_images;

DROP POLICY IF EXISTS "Authenticated users can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can insert stock movements" ON public.stock_movements;

DROP POLICY IF EXISTS "Authenticated users can view product batches" ON public.product_batches;
DROP POLICY IF EXISTS "Authenticated users can insert product batches" ON public.product_batches;
DROP POLICY IF EXISTS "Authenticated users can update product batches" ON public.product_batches;
DROP POLICY IF EXISTS "Authenticated users can delete product batches" ON public.product_batches;

DROP POLICY IF EXISTS "Authenticated users can view purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can insert purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can delete purchase orders" ON public.purchase_orders;

DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order items" ON public.order_items;

DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;

DROP POLICY IF EXISTS "Authenticated users can view invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Authenticated users can insert invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Authenticated users can update invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Authenticated users can delete invoice items" ON public.invoice_items;

DROP POLICY IF EXISTS "Authenticated users can view service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can insert service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can update service records" ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can delete service records" ON public.service_records;

DROP POLICY IF EXISTS "Authenticated users can view service parts" ON public.service_parts;
DROP POLICY IF EXISTS "Authenticated users can insert service parts" ON public.service_parts;
DROP POLICY IF EXISTS "Authenticated users can update service parts" ON public.service_parts;
DROP POLICY IF EXISTS "Authenticated users can delete service parts" ON public.service_parts;

-- Create new open policies for warehouses
CREATE POLICY "Anyone can view warehouses" ON public.warehouses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update warehouses" ON public.warehouses
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete warehouses" ON public.warehouses
  FOR DELETE USING (true);

-- Create new open policies for products
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert products" ON public.products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update products" ON public.products
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete products" ON public.products
  FOR DELETE USING (true);

-- Create new open policies for suppliers
CREATE POLICY "Anyone can view suppliers" ON public.suppliers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update suppliers" ON public.suppliers
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete suppliers" ON public.suppliers
  FOR DELETE USING (true);

-- Create new open policies for product variants
CREATE POLICY "Anyone can view product variants" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert product variants" ON public.product_variants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update product variants" ON public.product_variants
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete product variants" ON public.product_variants
  FOR DELETE USING (true);

-- Create new open policies for product images
CREATE POLICY "Anyone can view product images" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert product images" ON public.product_images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update product images" ON public.product_images
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete product images" ON public.product_images
  FOR DELETE USING (true);

-- Create new open policies for stock movements
CREATE POLICY "Anyone can view stock movements" ON public.stock_movements
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert stock movements" ON public.stock_movements
  FOR INSERT WITH CHECK (true);

-- Create new open policies for product batches
CREATE POLICY "Anyone can view product batches" ON public.product_batches
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert product batches" ON public.product_batches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update product batches" ON public.product_batches
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete product batches" ON public.product_batches
  FOR DELETE USING (true);

-- Create new open policies for purchase orders
CREATE POLICY "Anyone can view purchase orders" ON public.purchase_orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert purchase orders" ON public.purchase_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update purchase orders" ON public.purchase_orders
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete purchase orders" ON public.purchase_orders
  FOR DELETE USING (true);

-- Create new open policies for order items
CREATE POLICY "Anyone can view order items" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update order items" ON public.order_items
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete order items" ON public.order_items
  FOR DELETE USING (true);

-- Create new open policies for customers
CREATE POLICY "Anyone can view customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert customers" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update customers" ON public.customers
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete customers" ON public.customers
  FOR DELETE USING (true);

-- Create new open policies for invoices
CREATE POLICY "Anyone can view invoices" ON public.invoices
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert invoices" ON public.invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update invoices" ON public.invoices
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete invoices" ON public.invoices
  FOR DELETE USING (true);

-- Create new open policies for invoice items
CREATE POLICY "Anyone can view invoice items" ON public.invoice_items
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert invoice items" ON public.invoice_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update invoice items" ON public.invoice_items
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete invoice items" ON public.invoice_items
  FOR DELETE USING (true);

-- Create new open policies for service records
CREATE POLICY "Anyone can view service records" ON public.service_records
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert service records" ON public.service_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update service records" ON public.service_records
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete service records" ON public.service_records
  FOR DELETE USING (true);

-- Create new open policies for service parts
CREATE POLICY "Anyone can view service parts" ON public.service_parts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert service parts" ON public.service_parts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update service parts" ON public.service_parts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete service parts" ON public.service_parts
  FOR DELETE USING (true);

-- Make all user-related columns optional
ALTER TABLE public.warehouses ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.customers ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.service_records ALTER COLUMN created_by DROP NOT NULL;