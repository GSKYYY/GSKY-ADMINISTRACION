-- ⚠️ INSTRUCCIONES:
-- 1. Copia todo este código.
-- 2. Ve al "SQL Editor" en tu proyecto de Supabase.
-- 3. Pega el código y presiona "RUN".

-- CORRECCIÓN TABLA CLIENTES
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS measurements text; 
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
-- Nota: measurements se guarda como texto JSON desde la app.

-- CORRECCIÓN TABLA ORDENES
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_color text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_type text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS garment_model text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Asegurar tipos de datos complejos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference_images text[];
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items jsonb;

-- Asegurar fechas
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reception_date timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deadline timestamptz;
