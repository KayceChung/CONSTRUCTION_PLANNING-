# ConstructTrack

Ứng dụng quản lý tiến độ thi công xây dựng demo bằng React + Vite + TypeScript.

## Công nghệ

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- React Router DOM
- Zustand
- React Hook Form + Zod
- Lucide React
- date-fns
- LocalStorage demo
- GitHub Pages

## Chạy local

1. Mở terminal ở thư mục dự án
2. Chạy `npm install`
3. Chạy `npm run dev`

Ứng dụng sẽ chạy ở `http://localhost:5174`.

## Build và deploy

- Build: `npm run build`
- Preview: `npm run preview`
- Deploy GitHub Pages: `npm run deploy`

## GitHub Pages

Dự án cấu hình `vite.config.ts` với `base: '/CONSTRUCTION_PLANNING-/'` và workflow deploy tự động tại `.github/workflows/deploy.yml`.

## Tính năng

- Đăng nhập demo Quản lý hoặc Giám sát
- Dashboard tổng quan dự án cho Quản lý
- Danh sách dự án và thêm/xóa dự án
- Project detail với Kanban board 6 cột
- Drag & drop công việc giữa các cột
- Upload ảnh thực tế
- Webhook gửi sự kiện khi tạo công việc, chuyển trạng thái, upload ảnh
- Lưu dữ liệu demo trong localStorage
- Responsive mobile-first

## Lưu ý

- Đây là ứng dụng demo được tích hợp Supabase.
- Dữ liệu lưu trên cả localStorage và Supabase.
- Cần thiết lập Supabase Auth và RLS policies để hoạt động đầy đủ.
- Webhook tạo khách hàng mới nên chạy từ Supabase trigger để tránh lỗi CORS từ trình duyệt.
- Webhook tạo dự án mới cũng nên chạy từ Supabase trigger để gửi kèm dữ liệu khách hàng và giám sát viên tham gia.

## Supabase Setup

### 1. Tạo bảng staff
```sql
create table if not exists public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id text,
  email text unique not null,
  full_name text,
  name text,
  phone text,
  phone1 text,
  phone2 text,
  is_active boolean default false,
  is_admin boolean default false,
  role text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);
```

### 2. Tạo bảng customers
```sql
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  phone2 text,
  email text,
  address text,
  source text,
  status text default 'lead',
  note text,
  zalo_thread_id text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);
```

### 3. Enable RLS trên cả hai bảng
```sql
alter table public.staff enable row level security;
alter table public.customers enable row level security;
```

### 4. Tạo RLS Policies cho staff
```sql
-- Policy cho phép user insert staff record của chính mình
create policy "Allow user to insert own staff record"
on public.staff
for insert
with check (auth.uid() = id);

-- Policy cho phép user select staff record của chính mình
create policy "Allow user to select own staff record"
on public.staff
for select
using (auth.uid() = id);

-- Policy cho phép user update staff record của chính mình
create policy "Allow user to update own staff record"
on public.staff
for update
using (auth.uid() = id);

alter table public.staff add column if not exists user_id text;
alter table public.staff add column if not exists phone1 text;
alter table public.staff add column if not exists phone2 text;
create index if not exists staff_user_id_idx on public.staff(user_id);

-- Trigger tự tạo staff khi có auth user mới
create or replace function public.handle_new_auth_user_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff (
    id,
    user_id,
    email,
    full_name,
    name,
    phone,
    phone1,
    phone2,
    role,
    is_active,
    created_at,
    updated_at
  ) values (
    new.id,
    null,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.raw_user_meta_data ->> 'phone',
    null,
    null,
    'supervisor',
    false,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update set
    email = excluded.email,
    user_id = coalesce(public.staff.user_id, excluded.user_id),
    full_name = coalesce(public.staff.full_name, excluded.full_name),
    name = coalesce(public.staff.name, excluded.name),
    phone = coalesce(public.staff.phone, excluded.phone),
    phone1 = coalesce(public.staff.phone1, excluded.phone1),
    phone2 = coalesce(public.staff.phone2, excluded.phone2),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_staff on auth.users;
create trigger on_auth_user_created_create_staff
after insert on auth.users
for each row execute function public.handle_new_auth_user_staff();
```

### 5. Tạo RLS Policies cho customers
```sql
-- Policy cho phép tất cả xem customers
create policy "Allow all users to read customers"
on public.customers
for select
using (true);

-- Policy cho phép tạo customers
create policy "Allow authenticated users to create customers"
on public.customers
for insert
with check (true);

-- Policy cho phép cập nhật customers
create policy "Allow authenticated users to update customers"
on public.customers
for update
using (true);

-- Policy cho phép xóa customers
create policy "Allow authenticated users to delete customers"
on public.customers
for delete
using (true);
```

### 6. Bắn webhook backend khi tạo khách hàng mới
```sql
create extension if not exists pg_net;

create or replace function public.notify_customer_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform net.http_post(
      url := 'https://yi7a1c8g.rpcld.co/webhook/b1632ac8-f6b2-493e-a868-64ad461b91f1',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'event', 'customer_created',
        'timestamp', to_jsonb(timezone('utc', now())),
        'customer', jsonb_build_object(
          'id', new.id,
          'fullName', new.full_name,
          'phone', new.phone,
          'phone2', new.phone2,
          'email', new.email,
          'address', new.address,
          'source', new.source,
          'status', new.status,
          'note', new.note,
          'notes', new.notes,
          'zaloThreadId', new.zalo_thread_id,
          'projectIds', '[]'::jsonb,
          'createdAt', to_jsonb(new.created_at),
          'updatedAt', to_jsonb(new.updated_at)
        )
      )
    );
  exception
    when others then
      raise log 'customer_created webhook failed for customer %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_customer_created_notify_webhook on public.customers;
create trigger on_customer_created_notify_webhook
after insert on public.customers
for each row execute function public.notify_customer_created();
```

Lưu ý: workflow ở URL webhook phải ở trạng thái active. Nếu webhook server trả `404 not registered`, trigger vẫn chạy nhưng phía endpoint sẽ không nhận dữ liệu.

### 7. Bắn webhook backend khi tạo dự án mới
```sql
create or replace function public.notify_project_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_payload jsonb;
  assigned_staff_payload jsonb;
  assigned_user_ids_payload jsonb;
  supervisors_payload jsonb;
begin
  select jsonb_build_object(
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
  into customer_payload
  from public.customers as customer_row
  where customer_row.id = new.customer_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', assigned.staff_id,
        'staffId', assigned.staff_id,
        'userId', staff_row.user_id,
        'user_id', staff_row.user_id,
        'name', coalesce(staff_row.name, staff_row.full_name, staff_row.email),
        'fullName', staff_row.full_name,
        'phone', staff_row.phone,
        'email', staff_row.email,
        'role', staff_row.role,
        'isActive', staff_row.is_active,
        'avatar', staff_row.avatar
      )
      order by assigned.ord
    ),
    '[]'::jsonb
  )
  into supervisors_payload
  from unnest(coalesce(new.assigned_staff, array[]::uuid[])) with ordinality as assigned(staff_id, ord)
  left join public.staff as staff_row on staff_row.id = assigned.staff_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'staffId', assigned.staff_id,
        'userId', staff_row.user_id,
        'user_id', staff_row.user_id,
        'name', coalesce(staff_row.name, staff_row.full_name, staff_row.email),
        'fullName', staff_row.full_name,
        'phone', staff_row.phone,
        'email', staff_row.email,
        'role', staff_row.role,
        'isActive', staff_row.is_active,
        'avatar', staff_row.avatar
      )
      order by assigned.ord
    ),
    '[]'::jsonb
  )
  into assigned_staff_payload
  from unnest(coalesce(new.assigned_staff, array[]::uuid[])) with ordinality as assigned(staff_id, ord)
  left join public.staff as staff_row on staff_row.id = assigned.staff_id;

  select coalesce(
    jsonb_agg(to_jsonb(staff_row.user_id) order by assigned.ord) filter (where staff_row.user_id is not null),
    '[]'::jsonb
  )
  into assigned_user_ids_payload
  from unnest(coalesce(new.assigned_staff, array[]::uuid[])) with ordinality as assigned(staff_id, ord)
  left join public.staff as staff_row on staff_row.id = assigned.staff_id;

  begin
    perform net.http_post(
      url := 'https://yi7a1c8g.rpcld.co/webhook/b44613c6-4148-4497-b1fe-298d6d84060d',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'event', 'project_created',
        'timestamp', to_jsonb(timezone('utc', now())),
        'project', jsonb_build_object(
          'id', new.id,
          'name', new.name,
          'location', new.location,
          'client', new.client,
          'customerId', new.customer_id,
          'category', new.category,
          'categoryNote', new.category_note,
          'addressFull', new.address_full,
          'addressWard', new.address_ward,
          'addressDistrict', new.address_district,
          'addressProvince', new.address_province,
          'addressGoogleMapsUrl', new.address_google_maps_url,
          'contractValue', new.contract_value,
          'paidAmount', new.paid_amount,
          'paymentNote', new.payment_note,
          'distanceKm', new.distance_km,
          'startDate', new.start_date,
          'endDate', new.end_date,
          'webhookUrl', new.webhook_url,
          'assignedStaffIds', to_jsonb(coalesce(new.assigned_staff, array[]::uuid[])),
          'assignedUserIds', assigned_user_ids_payload,
          'assignedStaff', assigned_staff_payload,
          'projectTypeId', new.project_type_id,
          'notes', new.notes,
          'zaloGroupThreadId', new.zalo_group_thread_id,
          'zaloGroupName', new.zalo_group_name,
          'zaloLinkedAt', new.zalo_linked_at,
          'zaloStatus', new.zalo_status,
          'createdAt', new.created_at,
          'updatedAt', new.updated_at
        ),
        'customer', customer_payload,
        'supervisors', supervisors_payload
      )
    );
  exception
    when others then
      raise log 'project_created webhook failed for project %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_project_created_notify_webhook on public.projects;
create trigger on_project_created_notify_webhook
after insert on public.projects
for each row execute function public.notify_project_created();
```

Payload sẽ gồm 3 khối chính: `project`, `customer`, và `supervisors`.

Mỗi nhân sự được gán sẽ có thêm `userId` và `user_id` lấy từ `public.staff.user_id` để dùng cho Zalo group. Ngoài ra `project.assignedUserIds` chỉ chứa các `user_id` hợp lệ để đưa thẳng sang n8n.

### 8. Bắn webhook backend khi thêm nhân sự mới hoặc cập nhật `phone` / `phone1` / `phone2`
```sql
alter table public.staff add column if not exists phone1 text;
alter table public.staff add column if not exists phone2 text;

create or replace function public.notify_staff_phone_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and old.phone is not distinct from new.phone
    and old.phone1 is not distinct from new.phone1
    and old.phone2 is not distinct from new.phone2 then
    return new;
  end if;

  begin
    perform net.http_post(
      url := 'https://yi7a1c8g.rpcld.co/webhook/df2a6ad6-afad-45d8-ba3c-f7cafaaa4060',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'event', case when tg_op = 'INSERT' then 'staff_created' else 'staff_phone_updated' end,
        'operation', tg_op,
        'timestamp', to_jsonb(timezone('utc', now())),
        'staff', jsonb_build_object(
          'id', new.id,
          'userId', new.user_id,
          'user_id', new.user_id,
          'email', new.email,
          'name', coalesce(new.name, new.full_name, new.email),
          'fullName', new.full_name,
          'phone', new.phone,
          'phone1', new.phone1,
          'phone2', new.phone2,
          'role', new.role,
          'isActive', new.is_active,
          'isAdmin', new.is_admin,
          'avatar', new.avatar,
          'createdAt', new.created_at,
          'updatedAt', new.updated_at
        ),
        'changes', case
          when tg_op = 'UPDATE' then jsonb_build_object(
            'phone', jsonb_build_object('old', old.phone, 'new', new.phone),
            'phone1', jsonb_build_object('old', old.phone1, 'new', new.phone1),
            'phone2', jsonb_build_object('old', old.phone2, 'new', new.phone2)
          )
          else null
        end
      )
    );
  exception
    when others then
      raise log 'staff webhook failed for staff %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_staff_phone_changed_notify_webhook on public.staff;
create trigger on_staff_phone_changed_notify_webhook
after insert or update of phone, phone1, phone2 on public.staff
for each row execute function public.notify_staff_phone_changed();
```

Webhook này sẽ bắn JSON khi có staff mới và khi `phone`, `phone1` hoặc `phone2` thay đổi trong `public.staff`.
