-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table for e-commerce
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Customer information
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  
  -- Shipping address (stored as JSONB for flexibility)
  shipping_address JSONB NOT NULL,
  
  -- Order items (stored as JSONB array)
  items JSONB NOT NULL,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: pending, processing, shipped, delivered, cancelled
  
  -- Printful integration
  printful_order_id TEXT,
  printful_status TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Timestamps for status changes
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create index on customer email for lookups
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);

-- Create index on status for filtering
CREATE INDEX idx_orders_status ON public.orders(status);

-- Create index on created_at for sorting
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_orders_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can create orders
CREATE POLICY "Authenticated users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.orders IS 'Stores customer orders for photo prints';
COMMENT ON COLUMN public.orders.shipping_address IS 'JSONB object with address, city, state, zip, country, phone';
COMMENT ON COLUMN public.orders.items IS 'JSONB array of order items with photo_id, product details, quantity, price';
