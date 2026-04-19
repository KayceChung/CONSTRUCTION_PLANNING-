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

## Supabase Setup

### 1. Tạo bảng staff
```sql
create table if not exists public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  name text,
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
    email,
    full_name,
    name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.raw_user_meta_data ->> 'phone',
    'supervisor',
    false,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.staff.full_name, excluded.full_name),
    name = coalesce(public.staff.name, excluded.name),
    phone = coalesce(public.staff.phone, excluded.phone),
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
