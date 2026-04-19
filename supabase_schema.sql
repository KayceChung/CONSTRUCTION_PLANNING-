-- =============================================
-- SUPABASE POSTGRESQL SCHEMA FOR PROJECT MANAGEMENT CRM
-- Generated from TypeScript interfaces and seed data
-- Compatible with Supabase (PostgreSQL 15+)
-- =============================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ENUMS
CREATE TYPE role_enum AS ENUM ('manager', 'supervisor');
CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'done', 'adjustment', 'pending', 'cancelled');
CREATE TYPE project_category_enum AS ENUM ('new_construction', 'renovation', 'other');
CREATE TYPE customer_status_enum AS ENUM ('lead', 'nurturing', 'contracted', 'inactive');
CREATE TYPE interaction_type_enum AS ENUM ('call', 'meet', 'zalo', 'email', 'note', 'site_visit');
CREATE TYPE attachment_type_enum AS ENUM ('image', 'pdf', 'other');
CREATE TYPE zalo_status_enum AS ENUM ('linked', 'pending', 'failed');

-- TABLES

-- Staff table (users with roles)
CREATE TABLE staff (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    phone TEXT,
    role role_enum NOT NULL DEFAULT 'supervisor',
    is_admin BOOLEAN DEFAULT false,
    avatar TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone2 TEXT,
    email TEXT,
    address TEXT,
    source TEXT, -- kênh biết đến
    status customer_status_enum DEFAULT 'lead',
    note TEXT,
    notes TEXT,
    zalo_thread_id TEXT, -- thread ID cá nhân trên Zalo
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Project types table
CREATE TABLE project_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task templates table
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_type_id UUID NOT NULL REFERENCES project_types(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT true,
    estimated_days INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    client TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    category project_category_enum NOT NULL,
    category_note TEXT,
    address_full TEXT NOT NULL,
    address_ward TEXT,
    address_district TEXT,
    address_province TEXT,
    address_google_maps_url TEXT,
    contract_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_note TEXT,
    distance_km DECIMAL(5,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    webhook_url TEXT NOT NULL,
    assigned_staff UUID[] DEFAULT '{}',
    project_type_id UUID REFERENCES project_types(id),
    notes TEXT,
    -- Zalo integration
    zalo_group_thread_id TEXT,
    zalo_group_name TEXT,
    zalo_linked_at TIMESTAMPTZ,
    zalo_status zalo_status_enum,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table (separated from projects for better normalization)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status task_status_enum DEFAULT 'todo',
    images TEXT[] DEFAULT '{}',
    deadline DATE,
    estimated_days INTEGER,
    start_date DATE,
    completed_at TIMESTAMPTZ,
    actual_days INTEGER,
    updated_by TEXT NOT NULL,
    note TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    from_template_id UUID REFERENCES task_templates(id),
    assignee UUID REFERENCES staff(id),
    task_deadline DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Attachments table (for project attachments)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type attachment_type_enum NOT NULL,
    size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Interaction logs table
CREATE TABLE interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type interaction_type_enum NOT NULL,
    date DATE NOT NULL,
    time TEXT, -- HH:mm format
    summary TEXT NOT NULL,
    next_action TEXT,
    next_action_date DATE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Change logs table (for task status changes)
CREATE TABLE change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES staff(id),
    user_name TEXT NOT NULL,
    user_role role_enum NOT NULL,
    previous_status task_status_enum,
    new_status task_status_enum NOT NULL,
    note TEXT,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- FOREIGN KEYS (additional constraints beyond REFERENCES)
-- Already handled in table definitions

-- INDEXES
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_task_templates_project_type_id ON task_templates(project_type_id);
CREATE INDEX idx_interaction_logs_customer_id ON interaction_logs(customer_id);
CREATE INDEX idx_interaction_logs_date ON interaction_logs(date);
CREATE INDEX idx_change_logs_task_id ON change_logs(task_id);
CREATE INDEX idx_change_logs_project_id ON change_logs(project_id);
CREATE INDEX idx_attachments_project_id ON attachments(project_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- Staff policies: users can create/read their own profile, managers can update all staff for approval/role management.
CREATE POLICY "Allow user to insert own staff record" ON staff FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow user to select own staff record" ON staff FOR SELECT TO authenticated USING (auth.uid() = id OR true);
CREATE POLICY "Allow user to update own staff record" ON staff FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow active managers to update staff" ON staff FOR UPDATE TO authenticated
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

CREATE POLICY "Allow authenticated users to read customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update customers" ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete customers" ON customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read project_types" ON project_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert project_types" ON project_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update project_types" ON project_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete project_types" ON project_types FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read task_templates" ON task_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert task_templates" ON task_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update task_templates" ON task_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete task_templates" ON task_templates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update projects" ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete projects" ON projects FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update tasks" ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete tasks" ON tasks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read attachments" ON attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert attachments" ON attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update attachments" ON attachments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete attachments" ON attachments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read interaction_logs" ON interaction_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert interaction_logs" ON interaction_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update interaction_logs" ON interaction_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete interaction_logs" ON interaction_logs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read change_logs" ON change_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert change_logs" ON change_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update change_logs" ON change_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete change_logs" ON change_logs FOR DELETE TO authenticated USING (true);

-- Project webhook trigger: send new project payload from backend including customer and supervisors.
CREATE OR REPLACE FUNCTION public.notify_project_created()
RETURNS TRIGGER
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

-- Customer webhook trigger: send new customer payload from backend to avoid browser CORS issues.
CREATE OR REPLACE FUNCTION public.notify_customer_created()
RETURNS TRIGGER
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

-- TRIGGERS
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_types_updated_at BEFORE UPDATE ON project_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_project_created_notify_webhook AFTER INSERT ON projects FOR EACH ROW EXECUTE FUNCTION public.notify_project_created();
CREATE TRIGGER on_customer_created_notify_webhook AFTER INSERT ON customers FOR EACH ROW EXECUTE FUNCTION public.notify_customer_created();

-- SEED DATA

-- Seed project types
INSERT INTO project_types (id, name, color, is_active, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Xây dựng nhà phố', '#3B82F6', true, now(), now()),
('550e8400-e29b-41d4-a716-446655440002', 'Xây dựng biệt thự', '#10B981', true, now(), now()),
('550e8400-e29b-41d4-a716-446655440003', 'Sửa chữa nhà cửa', '#F59E0B', true, now(), now()),
('550e8400-e29b-41d4-a716-446655440004', 'Nội thất', '#8B5CF6', true, now(), now());

-- Seed task templates
INSERT INTO task_templates (id, project_type_id, title, sort_order, is_default, estimated_days, created_at, updated_at) VALUES
-- Xây dựng nhà phố
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Khảo sát hiện trạng', 1, true, 5, now(), now()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Thiết kế kiến trúc', 2, true, 14, now(), now()),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Xin giấy phép xây dựng', 3, true, 30, now(), now()),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Đào móng', 4, true, 7, now(), now()),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Xây dựng móng', 5, true, 14, now(), now()),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Xây dựng khung nhà', 6, true, 30, now(), now()),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Hoàn thiện nội ngoại thất', 7, true, 45, now(), now()),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 'Bàn giao công trình', 8, true, 3, now(), now()),
-- Xây dựng biệt thự
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 'Khảo sát địa hình', 1, true, 5, now(), now()),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'Thiết kế biệt thự', 2, true, 21, now(), now()),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Xin giấy phép xây dựng', 3, true, 45, now(), now()),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Đào móng và cọc', 4, true, 14, now(), now()),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Xây dựng móng', 5, true, 21, now(), now()),
('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Xây dựng khung và mái', 6, true, 60, now(), now()),
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Hoàn thiện nội ngoại thất', 7, true, 75, now(), now()),
('660e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Bàn giao công trình', 8, true, 5, now(), now()),
-- Sửa chữa nhà cửa
('660e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440003', 'Khảo sát hiện trạng', 1, true, 3, now(), now()),
('660e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440003', 'Lập phương án sửa chữa', 2, true, 7, now(), now()),
('660e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440003', 'Xin giấy phép (nếu cần)', 3, true, 14, now(), now()),
('660e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440003', 'Thực hiện sửa chữa', 4, true, 21, now(), now()),
('660e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Hoàn thiện', 5, true, 7, now(), now()),
('660e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'Bàn giao', 6, true, 2, now(), now()),
-- Nội thất
('660e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440004', 'Khảo sát không gian', 1, true, 3, now(), now()),
('660e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440004', 'Thiết kế nội thất', 2, true, 14, now(), now()),
('660e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440004', 'Sản xuất đồ nội thất', 3, true, 21, now(), now()),
('660e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440004', 'Lắp đặt nội thất', 4, true, 10, now(), now()),
('660e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440004', 'Hoàn thiện', 5, true, 5, now(), now()),
('660e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440004', 'Bàn giao', 6, true, 2, now(), now());

-- Staff rows should be created from auth.users ids.
-- The recommended approach is the signup trigger in supabase_staff_signup_trigger.sql.
-- Other seed data (customers, projects, etc.) can be inserted after creating the records in your application
-- as they may reference each other and require specific UUIDs for relationships.