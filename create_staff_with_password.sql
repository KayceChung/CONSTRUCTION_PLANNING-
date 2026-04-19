-- =============================================
-- HƯỚNG DẪN TẠO STAFF VỚI MẬT KHẨU
-- =============================================
-- LEGACY NOTE:
-- Script này phản ánh schema staff cũ có pin_hash.
-- Schema live hiện tại không còn pin_hash; staff nên bám theo auth.users.id.
-- Chỉ dùng làm tài liệu tham khảo, không nên chạy nguyên trạng trên database hiện tại.

-- PHƯƠNG PHÁP 1: SỬ DỤNG SUPABASE DASHBOARD (KHUYẾN NGHỊ)

-- Bước 1: Tạo User Account
-- 1. Vào Supabase Dashboard: https://supabase.com/dashboard/project/eqhjwicfoyypminlruyo
-- 2. Chọn "Authentication" → "Users"
-- 3. Click "Add User"
-- 4. Điền thông tin:
--    - Email: manager@constructtrack.com
--    - Password: password123 (hoặc mật khẩu bạn muốn)
--    - Auto Confirm User: ON
-- 5. Click "Create User"
-- 6. Copy User ID (UUID) hiển thị

-- Bước 2: Thêm thông tin Staff
-- Chạy SQL sau trong SQL Editor (thay thế UUID):

INSERT INTO staff (
  id,
  name,
  phone,
  email,
  role,
  pin_hash,
  is_active,
  created_at,
  updated_at
) VALUES (
  'your-copied-uuid-here', -- UUID từ bước 1
  'Nguyễn Văn Manager',
  '0123456789',
  'manager@constructtrack.com',
  'manager',
  '', -- Không sử dụng
  true,
  now(),
  now()
);

-- =============================================
-- PHƯƠNG PHÁP 2: SỬ DỤNG SQL DIRECT (NÂNG CAO)
-- =============================================

-- Tạo user trong auth.users với mật khẩu đã hash
-- (Thay thế email và password theo ý muốn)

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Tạo user trong auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'manager@constructtrack.com',
        crypt('password123', gen_salt('bf')), -- Mật khẩu: password123
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        false
    ) RETURNING id INTO new_user_id;

    -- Tạo record trong bảng staff
    INSERT INTO staff (
        id,
        name,
        phone,
        email,
        role,
        pin_hash,
        is_active
    ) VALUES (
        new_user_id,
        'Nguyễn Văn Manager',
        '0123456789',
        'manager@constructtrack.com',
        'manager',
        '',
        true
    );

    RAISE NOTICE 'Created staff with ID: %', new_user_id;
END $$;

-- =============================================
-- TẠO NHIỀU STAFF CÙNG LÚC
-- =============================================

-- Tạo Manager
DO $$
DECLARE
    manager_id UUID;
BEGIN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'manager@constructtrack.com', crypt('manager123', gen_salt('bf')), now(), now(), now(), '{"provider": "email", "providers": ["email"]}', '{}', false)
    RETURNING id INTO manager_id;

    INSERT INTO staff (id, name, phone, email, role, pin_hash, is_active)
    VALUES (manager_id, 'Nguyễn Văn Manager', '0123456789', 'manager@constructtrack.com', 'manager', '', true);
END $$;

-- Tạo Supervisor
DO $$
DECLARE
    supervisor_id UUID;
BEGIN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'supervisor@constructtrack.com', crypt('supervisor123', gen_salt('bf')), now(), now(), now(), '{"provider": "email", "providers": ["email"]}', '{}', false)
    RETURNING id INTO supervisor_id;

    INSERT INTO staff (id, name, phone, email, role, pin_hash, is_active)
    VALUES (supervisor_id, 'Trần Thị Supervisor', '0987654321', 'supervisor@constructtrack.com', 'supervisor', '', true);
END $$;

-- =============================================
-- KIỂM TRA STAFF ĐÃ TẠO
-- =============================================

-- Xem tất cả staff
SELECT
    s.id,
    s.name,
    s.email,
    s.role,
    s.phone,
    s.is_active,
    au.email_confirmed_at
FROM staff s
JOIN auth.users au ON s.id = au.id
ORDER BY s.created_at DESC;

-- =============================================
-- RESET MẬT KHẨU (NẾU CẦN)
-- =============================================

-- Trong Dashboard: Authentication → Users → chọn user → Reset Password
-- Hoặc update trực tiếp (không khuyến nghị cho production):

-- UPDATE auth.users
-- SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
-- WHERE email = 'manager@constructtrack.com';