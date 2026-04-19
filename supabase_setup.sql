-- ====== CUSTOMERS TABLE ======
DROP TABLE IF EXISTS public.customers CASCADE;

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone2 TEXT,
  email TEXT,
  address TEXT,
  source TEXT,
  status TEXT DEFAULT 'lead',
  note TEXT,
  notes TEXT,
  zalo_thread_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes
CREATE INDEX customers_phone_idx ON public.customers(phone);
CREATE INDEX customers_status_idx ON public.customers(status);
CREATE INDEX customers_created_at_idx ON public.customers(created_at);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
DROP POLICY IF EXISTS "Allow all users to read customers" ON public.customers;
CREATE POLICY "Allow all users to read customers"
ON public.customers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create customers" ON public.customers;
CREATE POLICY "Allow authenticated users to create customers"
ON public.customers
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON public.customers;
CREATE POLICY "Allow authenticated users to update customers"
ON public.customers
FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON public.customers;
CREATE POLICY "Allow authenticated users to delete customers"
ON public.customers
FOR DELETE
USING (true);

-- ====== PROJECTS TABLE COLUMNS FIX ======
-- Thêm cột address nếu chưa có
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address_full TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address_ward TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address_district TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address_province TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address_google_maps_url TEXT;

-- ====== STAFF TABLE ======
DROP TABLE IF EXISTS public.staff CASCADE;

CREATE TABLE public.staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'supervisor',
  is_active BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create index
CREATE INDEX staff_email_idx ON public.staff(email);
CREATE INDEX staff_is_active_idx ON public.staff(is_active);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff
DROP POLICY IF EXISTS "Allow user to insert own staff record" ON public.staff;
CREATE POLICY "Allow user to insert own staff record"
ON public.staff
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow user to select own staff record" ON public.staff;
CREATE POLICY "Allow user to select own staff record"
ON public.staff
FOR SELECT
USING (auth.uid() = id OR true);

DROP POLICY IF EXISTS "Allow user to update own staff record" ON public.staff;
CREATE POLICY "Allow user to update own staff record"
ON public.staff
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow active managers to update staff" ON public.staff;
CREATE POLICY "Allow active managers to update staff"
ON public.staff
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staff AS manager_profile
    WHERE manager_profile.id = auth.uid()
      AND manager_profile.role = 'manager'
      AND manager_profile.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.staff AS manager_profile
    WHERE manager_profile.id = auth.uid()
      AND manager_profile.role = 'manager'
      AND manager_profile.is_active = true
  )
);

-- ====== AUTO CREATE STAFF PROFILE FROM AUTH ======
-- Giải quyết trường hợp auth.users đã tạo nhưng frontend chưa thể insert vào staff
-- vì session sau signUp chưa sẵn sàng hoặc bị RLS chặn.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff (
    id,
    email,
    full_name,
    name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name'),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    'supervisor',
    false,
    timezone('utc', now()),
    timezone('utc', now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.staff.full_name, EXCLUDED.full_name),
    name = COALESCE(public.staff.name, EXCLUDED.name),
    phone = COALESCE(public.staff.phone, EXCLUDED.phone),
    updated_at = timezone('utc', now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_staff ON auth.users;
CREATE TRIGGER on_auth_user_created_create_staff
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user_staff();
