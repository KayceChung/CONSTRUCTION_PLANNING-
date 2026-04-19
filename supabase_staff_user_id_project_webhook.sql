-- Add staff.user_id for Zalo thread/user identifier
-- and include it in project_created webhook payload.

ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS staff_user_id_idx
ON public.staff(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff (
    id,
    user_id,
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
    NULL,
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
    user_id = COALESCE(public.staff.user_id, EXCLUDED.user_id),
    full_name = COALESCE(public.staff.full_name, EXCLUDED.full_name),
    name = COALESCE(public.staff.name, EXCLUDED.name),
    phone = COALESCE(public.staff.phone, EXCLUDED.phone),
    updated_at = timezone('utc', now());

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_project_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_payload jsonb;
  assigned_staff_payload jsonb;
  assigned_user_ids_payload jsonb;
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
        'id', assigned.staff_id,
        'staffId', assigned.staff_id,
        'userId', staff_row.user_id,
        'user_id', staff_row.user_id,
        'name', COALESCE(staff_row.name, staff_row.full_name, staff_row.email),
        'fullName', staff_row.full_name,
        'phone', staff_row.phone,
        'email', staff_row.email,
        'role', staff_row.role,
        'isActive', staff_row.is_active,
        'avatar', staff_row.avatar
      )
      ORDER BY assigned.ord
    ),
    '[]'::jsonb
  )
  INTO supervisors_payload
  FROM unnest(COALESCE(NEW.assigned_staff, ARRAY[]::uuid[])) WITH ORDINALITY AS assigned(staff_id, ord)
  LEFT JOIN public.staff AS staff_row ON staff_row.id = assigned.staff_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'staffId', assigned.staff_id,
        'userId', staff_row.user_id,
        'user_id', staff_row.user_id,
        'name', COALESCE(staff_row.name, staff_row.full_name, staff_row.email),
        'fullName', staff_row.full_name,
        'phone', staff_row.phone,
        'email', staff_row.email,
        'role', staff_row.role,
        'isActive', staff_row.is_active,
        'avatar', staff_row.avatar
      )
      ORDER BY assigned.ord
    ),
    '[]'::jsonb
  )
  INTO assigned_staff_payload
  FROM unnest(COALESCE(NEW.assigned_staff, ARRAY[]::uuid[])) WITH ORDINALITY AS assigned(staff_id, ord)
  LEFT JOIN public.staff AS staff_row ON staff_row.id = assigned.staff_id;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(staff_row.user_id) ORDER BY assigned.ord) FILTER (WHERE staff_row.user_id IS NOT NULL),
    '[]'::jsonb
  )
  INTO assigned_user_ids_payload
  FROM unnest(COALESCE(NEW.assigned_staff, ARRAY[]::uuid[])) WITH ORDINALITY AS assigned(staff_id, ord)
  LEFT JOIN public.staff AS staff_row ON staff_row.id = assigned.staff_id;

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
          'assignedUserIds', assigned_user_ids_payload,
          'assignedStaff', assigned_staff_payload,
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