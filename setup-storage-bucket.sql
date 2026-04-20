-- SQL Script để setup Storage Policies cho task-images bucket
-- Lưu ý: Bucket 'task-images' cần được tạo trước qua Supabase Dashboard hoặc API

-- Xóa các policy cũ nếu tồn tại (optional)
DROP POLICY IF EXISTS "Allow public read on task-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to task-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from task-images" ON storage.objects;

-- Cho phép mọi người đọc (download) ảnh từ task-images bucket
CREATE POLICY "Allow public read on task-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-images');

-- Cho phép authenticated users upload ảnh vào task-images bucket
CREATE POLICY "Allow authenticated upload to task-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-images' 
  AND auth.role() = 'authenticated'
);

-- Cho phép authenticated users xóa ảnh từ task-images bucket
CREATE POLICY "Allow authenticated delete from task-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-images'
  AND auth.role() = 'authenticated'
);

-- Cho phép authenticated users update ảnh trong task-images bucket
CREATE POLICY "Allow authenticated update on task-images"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'task-images'
  AND auth.role() = 'authenticated'
);
