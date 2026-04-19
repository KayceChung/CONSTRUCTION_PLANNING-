CREATE EXTENSION IF NOT EXISTS pg_net;

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

-- Backend webhook for newly created projects
CREATE OR REPLACE FUNCTION public.notify_project_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_payload jsonb;
  supervisors_payload jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', customer_row.id,
    'fullName', customer_row.full_name,
    'phone', customer_row.phone,
    'phone2', customer_row.phone2,
    'email', customer_row.email,
    'address', customer_row.address,
    'source', customer_row.source,
    'status', customer_row.status,
    'note', customer_row.note,
    'notes', customer_row.notes,
    'zaloThreadId', customer_row.zalo_thread_id,
    'createdAt', customer_row.created_at,
    'updatedAt', customer_row.updated_at
  )
  INTO customer_payload
  FROM public.customers AS customer_row
  WHERE customer_row.id = NEW.customer_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', staff_row.id,
        'name', COALESCE(staff_row.name, staff_row.full_name, staff_row.email),
        'fullName', staff_row.full_name,
        'phone', staff_row.phone,
        'email', staff_row.email,
        'role', staff_row.role,
        'isActive', staff_row.is_active,
        'avatar', staff_row.avatar
      )
    ),
    '[]'::jsonb
  )
  INTO supervisors_payload
  FROM public.staff AS staff_row
  WHERE staff_row.id = ANY(COALESCE(NEW.assigned_staff, ARRAY[]::uuid[]));

  BEGIN
    PERFORM net.http_post(
      url := 'https://yi7a1c8g.rpcld.co/webhook/b44613c6-4148-4497-b1fe-298d6d84060d',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'event', 'project_created',
        'timestamp', to_jsonb(timezone('utc', now())),
        'project', jsonb_build_object(
          'id', NEW.id,
          'name', NEW.name,
          'location', NEW.location,
          'client', NEW.client,
          'customerId', NEW.customer_id,
          'category', NEW.category,
          'categoryNote', NEW.category_note,
          'addressFull', NEW.address_full,
          'addressWard', NEW.address_ward,
          'addressDistrict', NEW.address_district,
          'addressProvince', NEW.address_province,
          'addressGoogleMapsUrl', NEW.address_google_maps_url,
          'contractValue', NEW.contract_value,
          'paidAmount', NEW.paid_amount,
          'paymentNote', NEW.payment_note,
          'distanceKm', NEW.distance_km,
          'startDate', NEW.start_date,
          'endDate', NEW.end_date,
          'webhookUrl', NEW.webhook_url,
          'assignedStaffIds', to_jsonb(COALESCE(NEW.assigned_staff, ARRAY[]::uuid[])),
          'projectTypeId', NEW.project_type_id,
          'notes', NEW.notes,
          'zaloGroupThreadId', NEW.zalo_group_thread_id,
          'zaloGroupName', NEW.zalo_group_name,
          'zaloLinkedAt', NEW.zalo_linked_at,
          'zaloStatus', NEW.zalo_status,
          'createdAt', NEW.created_at,
          'updatedAt', NEW.updated_at
        ),
        'customer', customer_payload,
        'supervisors', supervisors_payload
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'project_created webhook failed for project %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_created_notify_webhook ON public.projects;
CREATE TRIGGER on_project_created_notify_webhook
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.notify_project_created();

-- Backend webhook for new customers
CREATE OR REPLACE FUNCTION public.notify_customer_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://yi7a1c8g.rpcld.co/webhook/b1632ac8-f6b2-493e-a868-64ad461b91f1',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'event', 'customer_created',
        'timestamp', to_jsonb(timezone('utc', now())),
        'customer', jsonb_build_object(
          'id', NEW.id,
          'fullName', NEW.full_name,
          'phone', NEW.phone,
          'phone2', NEW.phone2,
          'email', NEW.email,
          'address', NEW.address,
          'source', NEW.source,
          'status', NEW.status,
          'note', NEW.note,
          'notes', NEW.notes,
          'zaloThreadId', NEW.zalo_thread_id,
          'projectIds', '[]'::jsonb,
          'createdAt', to_jsonb(NEW.created_at),
          'updatedAt', to_jsonb(NEW.updated_at)
        )
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'customer_created webhook failed for customer %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_customer_created_notify_webhook ON public.customers;
CREATE TRIGGER on_customer_created_notify_webhook
AFTER INSERT ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_created();

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
