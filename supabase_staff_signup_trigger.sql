-- Auto-create staff row from auth.users after signup
-- Run this in Supabase SQL Editor once

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
