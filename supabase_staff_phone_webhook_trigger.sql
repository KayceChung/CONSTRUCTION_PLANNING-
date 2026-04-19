-- Add staff phone1/phone2 columns and send backend webhook
-- when a new staff row is created or phone1/phone2 changes.

ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS phone1 TEXT;

ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS phone2 TEXT;

CREATE OR REPLACE FUNCTION public.notify_staff_phone_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.phone1 IS NOT DISTINCT FROM NEW.phone1
    AND OLD.phone2 IS NOT DISTINCT FROM NEW.phone2 THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://yi7a1c8g.rpcld.co/webhook/df2a6ad6-afad-45d8-ba3c-f7cafaaa4060',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'event', CASE WHEN TG_OP = 'INSERT' THEN 'staff_created' ELSE 'staff_phone_updated' END,
        'operation', TG_OP,
        'timestamp', to_jsonb(timezone('utc', now())),
        'staff', jsonb_build_object(
          'id', NEW.id,
          'userId', NEW.user_id,
          'user_id', NEW.user_id,
          'email', NEW.email,
          'name', COALESCE(NEW.name, NEW.full_name, NEW.email),
          'fullName', NEW.full_name,
          'phone', NEW.phone,
          'phone1', NEW.phone1,
          'phone2', NEW.phone2,
          'role', NEW.role,
          'isActive', NEW.is_active,
          'isAdmin', NEW.is_admin,
          'avatar', NEW.avatar,
          'createdAt', NEW.created_at,
          'updatedAt', NEW.updated_at
        ),
        'changes', CASE
          WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
            'phone1', jsonb_build_object('old', OLD.phone1, 'new', NEW.phone1),
            'phone2', jsonb_build_object('old', OLD.phone2, 'new', NEW.phone2)
          )
          ELSE NULL
        END
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'staff webhook failed for staff %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_staff_phone_changed_notify_webhook ON public.staff;
CREATE TRIGGER on_staff_phone_changed_notify_webhook
AFTER INSERT OR UPDATE OF phone1, phone2 ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.notify_staff_phone_changed();