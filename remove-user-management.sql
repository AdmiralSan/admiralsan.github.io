-- Drop policies from tables that reference users or roles
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS created_by;

DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
ALTER TABLE public.products DROP COLUMN IF EXISTS created_by;

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
ALTER TABLE public.stock_movements DROP COLUMN IF EXISTS created_by;

DROP POLICY IF EXISTS "Authenticated users can view product batches" ON public.product_batches;
DROP POLICY IF EXISTS "Authenticated users can insert product batches" ON public.product_batches;
DROP POLICY IF EXISTS "Authenticated users can update product batches" ON public.product_batches;
DROP POLICY IF EXISTS "Authenticated users can delete product batches" ON public.product_batches;

DROP POLICY IF EXISTS "Authenticated users can view purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can insert purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can delete purchase orders" ON public.purchase_orders;
ALTER TABLE public.purchase_orders DROP COLUMN IF EXISTS created_by;

DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order items" ON public.order_items;

-- Finally, drop the users table and its policies
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
DROP TABLE IF EXISTS public.users;

-- Disable RLS on tables to make them publicly accessible.
-- You can re-enable this later with new policies.
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
