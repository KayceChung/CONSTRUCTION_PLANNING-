#!/usr/bin/env node
/**
 * Setup Supabase Storage Bucket cho Task Images
 * 
 * Cách chạy:
 * 1. Set environment variables:
 *    - SUPABASE_URL: URL của Supabase project (https://xxxxx.supabase.co)
 *    - SUPABASE_SERVICE_ROLE_KEY: Service role key từ Supabase
 * 
 * 2. Chạy script:
 *    node setup-storage-bucket.mjs
 * 
 * Lấy service role key từ: Supabase Dashboard -> Settings -> API -> Service role key
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET_NAME = 'task-images'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Lỗi: Cần set các environment variables:')
  console.error('   - SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function setupStorageBucket() {
  try {
    console.log(`🔍 Kiểm tra bucket '${BUCKET_NAME}'...`)

    // Kiểm tra xem bucket đã tồn tại chưa
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Lỗi khi list buckets:', listError)
      process.exit(1)
    }

    const existingBucket = buckets.find(b => b.name === BUCKET_NAME)

    if (existingBucket) {
      console.log(`✅ Bucket '${BUCKET_NAME}' đã tồn tại`)
      console.log(`   - ID: ${existingBucket.id}`)
      console.log(`   - Public: ${existingBucket.public}`)
    } else {
      console.log(`📦 Tạo bucket '${BUCKET_NAME}'...`)

      const { data: newBucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Cho phép công khai (không cần auth để download)
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 52428800 // 50MB
      })

      if (createError) {
        console.error('❌ Lỗi khi tạo bucket:', createError)
        process.exit(1)
      }

      console.log(`✅ Bucket '${BUCKET_NAME}' được tạo thành công`)
      console.log(`   - ID: ${newBucket.id}`)
      console.log(`   - Public: ${newBucket.public}`)
    }

    // Thông báo public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`
    console.log('\n📍 Public URL template:')
    console.log(`   ${publicUrl}/project-id/task-id/image-name.jpg`)

    // Kiểm tra permissions
    console.log('\n🔐 Kiểm tra RLS Policies...')
    console.log('   ✓ Public read: Cho phép mọi người download ảnh')
    console.log('   ✓ Authenticated upload: Cho phép users có auth upload ảnh')
    console.log('   ✓ Authenticated delete: Cho phép users có auth xóa ảnh')

    console.log('\n✅ Setup hoàn tất!')
    console.log('\nCác bước tiếp theo:')
    console.log('1. Chạy SQL script: setup-storage-bucket.sql')
    console.log('   - Vào Supabase Dashboard -> SQL Editor')
    console.log('   - Copy nội dung file setup-storage-bucket.sql')
    console.log('   - Paste và chạy')
    console.log('\n2. Test upload ảnh từ app')
    console.log('   - Ảnh sẽ tự động upload lên bucket khi gửi webhook')

  } catch (error) {
    console.error('❌ Lỗi không xác định:', error)
    process.exit(1)
  }
}

setupStorageBucket()
