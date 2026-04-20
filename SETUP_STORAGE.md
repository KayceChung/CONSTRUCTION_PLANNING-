# Setup Supabase Storage Bucket cho Task Images

Hướng dẫn setup storage bucket để lưu trữ ảnh công khai cho Zalo webhook.

## 📋 Tệp tin

1. **setup-storage-bucket.mjs** - Node.js script để tạo bucket
2. **setup-storage-bucket.sql** - SQL script để cấu hình RLS policies

## 🚀 Bước 1: Tạo Bucket

### Lấy Service Role Key

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy **Service role key** (dòng dài bắt đầu với `eyJhbGc...`)

### Chạy Setup Script

```bash
# Set environment variables (PowerShell)
$env:SUPABASE_URL = "https://xxxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGc..."

# Chạy script
node setup-storage-bucket.mjs
```

**Hoặc** trên Linux/Mac:

```bash
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
node setup-storage-bucket.mjs
```

### Hoặc tạo bucket thủ công

1. Vào Supabase Dashboard
2. Chọn **Storage**
3. Click **New bucket**
4. Đặt tên: `task-images`
5. Toggle **Public bucket** ON
6. Click **Create**

## 🔐 Bước 2: Cấu hình RLS Policies

1. Vào Supabase Dashboard
2. Chọn **SQL Editor**
3. Click **New Query**
4. Copy toàn bộ nội dung từ `setup-storage-bucket.sql`
5. Paste vào và click **Run**

## ✅ Kiểm tra

### Test upload ảnh

```javascript
import { supabase } from './src/lib/supabase'

// Upload test image
const blob = new Blob(['test'], { type: 'image/jpeg' })
const { data, error } = await supabase.storage
  .from('task-images')
  .upload('test-project/test-task/test.jpg', blob)

if (!error) {
  const { data: publicUrl } = supabase.storage
    .from('task-images')
    .getPublicUrl(data.path)
  
  console.log('✅ Public URL:', publicUrl.publicUrl)
}
```

### URL format

Ảnh sẽ được lưu với cấu trúc:
```
https://xxxxx.supabase.co/storage/v1/object/public/task-images/
  └─ {projectId}/
     └─ {taskId}/
        └─ image-{timestamp}-{index}.jpg
```

Ví dụ:
```
https://xxxxx.supabase.co/storage/v1/object/public/task-images/
abc123/def456/image-1713600000-0.jpg
```

## 🎯 Webhook Image URLs

Khi task được hoàn thành, webhook sẽ gửi:

```json
{
  "task": {
    "imageUrls": [
      "https://xxxxx.supabase.co/storage/v1/object/public/task-images/...",
      "https://xxxxx.supabase.co/storage/v1/object/public/task-images/..."
    ],
    "imageUrlsCsv": "https://...,https://...",
    "imageUrlsJson": ["https://...", "https://..."],
    "hasImages": true
  }
}
```

## 🚨 Troubleshooting

### Lỗi: "Bucket already exists"

Bucket đã được tạo trước đó. Tiếp tục sang bước 2 (RLS Policies).

### Lỗi: "Invalid storage response"

- Kiểm tra SUPABASE_URL có đúng format không: `https://xxxxx.supabase.co`
- Kiểm tra SERVICE_ROLE_KEY có valid không

### Ảnh không hiển thị trên Zalo

- Kiểm tra bucket **Public** setting là **ON**
- Kiểm tra RLS policies được setup đúng
- Thử access trực tiếp URL ảnh trên browser

### Upload ảnh thất bại

- Kiểm tra file size < 50MB
- Kiểm tra MIME type hỗ trợ: jpeg, png, webp, gif
- Kiểm tra user có auth token hợp lệ

## 📞 Support

Nếu gặp vấn đề:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console errors
3. Check network tab để xem request/response

---

**Lưu ý:** Sau khi setup, ảnh sẽ tự động upload lên bucket khi webhook gửi task completed.
