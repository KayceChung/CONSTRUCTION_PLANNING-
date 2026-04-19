-- Backend webhook for newly created projects
-- Run this in Supabase SQL Editor once

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