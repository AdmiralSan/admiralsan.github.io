-- Add purchase_price column to products table
ALTER TABLE public.products ADD COLUMN purchase_price decimal(10,2) NOT NULL DEFAULT 0;
