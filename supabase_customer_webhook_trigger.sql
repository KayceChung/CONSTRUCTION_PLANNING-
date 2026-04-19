-- Backend webhook for newly created customers
-- Run this in Supabase SQL Editor once

CREATE EXTENSION IF NOT EXISTS pg_net;

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