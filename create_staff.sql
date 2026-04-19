-- =============================================
-- SQL để tạo Staff trong Supabase
-- =============================================
-- LEGACY NOTE:
-- File này được viết cho schema staff cũ có pin_hash.
-- Schema live hiện tại dùng staff.id = auth.users.id và không còn pin_hash.
-- Ưu tiên signup thường + trigger trong supabase_staff_signup_trigger.sql hoặc supabase_setup.sql.

-- BƯỚC 1: Tạo user account trong Supabase Auth (thực hiện trong Dashboard)
-- Đi tới: Authentication > Users > Add User
-- Hoặc sử dụng SQL sau (thay thế email và password):

-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   invited_at,
--   confirmation_token,
--   confirmation_sent_at,
--   recovery_token,
--   recovery_sent_at,
--   email_change_token_new,
--   email_change,
--   email_change_sent_at,
--   last_sign_in_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   is_super_admin,
--   created_at,
--   updated_at,
--   phone,
--   phone_confirmed_at,
--   email_change_token_current,
--   email_change_confirm_status
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000', -- instance_id của project
--   gen_random_uuid(), -- id của user
--   'authenticated',
--   'authenticated',
--   'manager@example.com', -- email
--   crypt('password123', gen_salt('bf')), -- encrypted password
--   now(), -- email_confirmed_at
--   NULL,
--   '',
--   NULL,
--   '',
--   NULL,
--   '',
--   '',
--   NULL,
--   NULL,
--   '{"provider": "email", "providers": ["email"]}',
--   '{}',
--   FALSE,
--   now(),
--   now(),
--   NULL,
--   NULL,
--   '',
--   0
-- );

-- BƯỚC 2: Thêm thông tin staff vào bảng staff
-- (Thay thế UUID bằng ID từ user đã tạo ở bước 1)

-- Ví dụ tạo Manager:
INSERT INTO staff (
  id, -- UUID từ auth.users.id
  name,
  phone,
  email,
  role,
  pin_hash, -- Không còn sử dụng, có thể để trống hoặc NULL
  is_active
) VALUES (
  'your-user-uuid-here', -- Thay thế bằng UUID thực tế từ auth.users
  'Nguyễn Văn Manager',
  '0123456789',
  'manager@example.com',
  'manager',
  '', -- PIN hash không còn sử dụng
  true
);

-- Ví dụ tạo Supervisor:
INSERT INTO staff (
  id,
  name,
  phone,
  email,
  role,
  pin_hash,
  is_active
) VALUES (
  'another-user-uuid-here', -- Thay thế bằng UUID thực tế từ auth.users
  'Trần Thị Supervisor',
  '0987654321',
  'supervisor@example.com',
  'supervisor',
  '',
  true
);

-- =============================================
-- CÁCH TẠO USER ĐƠN GIẢN HƠN (Khuyến nghị):
-- =============================================

-- 1. Vào Supabase Dashboard > Authentication > Users
-- 2. Click "Add User"
-- 3. Điền email và password
-- 4. Copy User ID (UUID) từ danh sách users
-- 5. Chạy SQL INSERT vào bảng staff với ID đó

-- Ví dụ với User ID đã có:
-- INSERT INTO staff (id, name, phone, email, role, pin_hash, is_active)
-- VALUES ('copied-uuid-here', 'Tên Nhân Viên', '0123456789', 'email@example.com', 'manager', '', true);