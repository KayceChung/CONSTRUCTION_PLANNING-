/**
 * Real Webhook Payload Template
 * Based on actual database schema (projects & tasks)
 */

const realPayload = {
  event: 'project_status_update',
  timestamp: '2026-04-21T10:30:45.123Z',
  source: 'ConstructTrack App',
  
  project: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Xây dựng nhà ở Hà Nội',
    location: 'Hà Nội',
    client: 'Nguyễn Văn A',
    customer_id: '660e8400-e29b-41d4-a716-446655440001',
    category: 'new_construction',
    category_note: 'Nhà ở 4 tầng',
    
    // Address info
    address_full: '123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
    address_ward: 'Phường Láng Thượng',
    address_district: 'Quận Đống Đa',
    address_province: 'Hà Nội',
    address_google_maps_url: 'https://maps.google.com/maps?q=21.0100,105.8050',
    
    // Financial info
    contract_value: 500000000,
    paid_amount: 250000000,
    payment_note: 'Đã thanh toán 50% theo hợp đồng',
    distance_km: 12.5,
    
    // Timeline
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    
    // Progress
    progress: 55,
    taskCount: 8,
    completedCount: 4,
    inProgressCount: 3,
    todoCount: 1,
    
    // Staff & settings
    assigned_staff: [
      '770e8400-e29b-41d4-a716-446655440002',
      '880e8400-e29b-41d4-a716-446655440003'
    ],
    project_type_id: '990e8400-e29b-41d4-a716-446655440004',
    notes: 'Dự án ưu tiên, cần hoàn thành đúng hạn',
    
    // Zalo integration
    zalo_group_thread_id: 'group_thread_12345',
    zalo_group_name: 'Nhóm Công Trình Hà Nội',
    zalo_linked_at: '2026-04-15T08:00:00Z',
    zalo_status: 'active',
    
    // Webhook config
    webhook_url: 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435',
    
    // Timestamps
    created_at: '2026-04-01T08:00:00Z',
    updated_at: '2026-04-21T10:30:45Z'
  },
  
  tasks: [
    {
      id: 'aaa00000-0000-0000-0000-000000000001',
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Xây dựng nền móng',
      description: 'Đào sâu, rót bê tông nền theo thiết kế kiến trúc',
      status: 'done',
      
      // Images (real array of URLs)
      images: [
        'https://storage.supabase.co/images/project-550e/task-001-001.jpg',
        'https://storage.supabase.co/images/project-550e/task-001-002.jpg',
        'https://storage.supabase.co/images/project-550e/task-001-003.jpg'
      ],
      imageCount: 3,
      
      // Timeline
      deadline: '2026-04-10',
      task_deadline: '2026-04-10',
      estimated_days: 10,
      start_date: '2026-03-25',
      completed_at: '2026-04-10T16:30:00Z',
      actual_days: 16,
      
      // Assignment & tracking
      updated_by: 'staff_001',
      assignee: '770e8400-e29b-41d4-a716-446655440002',
      note: 'Hoàn thành 100%, đã qua kiểm duyệt kỹ thuật',
      sort_order: 1,
      from_template_id: null,
      
      // Timestamps
      created_at: '2026-03-20T09:00:00Z',
      updated_at: '2026-04-10T16:30:00Z'
    },
    {
      id: 'aaa00000-0000-0000-0000-000000000002',
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Xây tường chính',
      description: 'Xây tường chính 4 tầng bằng gạch và vữa cement',
      status: 'in_progress',
      
      // Images
      images: [
        'https://storage.supabase.co/images/project-550e/task-002-001.jpg',
        'https://storage.supabase.co/images/project-550e/task-002-002.jpg'
      ],
      imageCount: 2,
      
      // Timeline
      deadline: '2026-05-15',
      task_deadline: '2026-05-15',
      estimated_days: 20,
      start_date: '2026-04-15',
      completed_at: null,
      actual_days: null,
      
      // Assignment & tracking
      updated_by: 'staff_002',
      assignee: '880e8400-e29b-41d4-a716-446655440003',
      note: 'Đã xây hoàn thành tầng 1, tiến hành tầng 2',
      sort_order: 2,
      from_template_id: null,
      
      // Timestamps
      created_at: '2026-04-02T10:00:00Z',
      updated_at: '2026-04-21T08:15:00Z'
    },
    {
      id: 'aaa00000-0000-0000-0000-000000000003',
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Lắp đặt kết cấu mái',
      description: 'Lắp đặt dầm thép và kết cấu mái theo bản vẽ',
      status: 'todo',
      
      // Images
      images: [],
      imageCount: 0,
      
      // Timeline
      deadline: '2026-05-30',
      task_deadline: '2026-05-30',
      estimated_days: 15,
      start_date: null,
      completed_at: null,
      actual_days: null,
      
      // Assignment & tracking
      updated_by: 'system',
      assignee: null,
      note: 'Chờ hoàn thành xây tường',
      sort_order: 3,
      from_template_id: null,
      
      // Timestamps
      created_at: '2026-04-05T11:00:00Z',
      updated_at: '2026-04-05T11:00:00Z'
    }
  ]
}

// Display
console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║   REAL WEBHOOK PAYLOAD - READY FOR REVIEW                      ║')
console.log('║   Based on actual database schema (projects & tasks)            ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

console.log(JSON.stringify(realPayload, null, 2))

// Summary
console.log('\n' + '═'.repeat(70))
console.log('📌 PAYLOAD STRUCTURE SUMMARY:')
console.log('═'.repeat(70))
console.log(`✅ Event: ${realPayload.event}`)
console.log(`✅ Project: ${realPayload.project.name}`)
console.log(`✅ Location: ${realPayload.project.location}`)
console.log(`✅ Address: ${realPayload.project.address_full}`)
console.log(`✅ Contract Value: ${realPayload.project.contract_value.toLocaleString('vi-VN')} VND`)
console.log(`✅ Paid Amount: ${realPayload.project.paid_amount.toLocaleString('vi-VN')} VND`)
console.log(`✅ Progress: ${realPayload.project.progress}% (${realPayload.project.completedCount}/${realPayload.project.taskCount} tasks)`)
console.log(`✅ Tasks: ${realPayload.tasks.length}`)
console.log(`   - Done: ${realPayload.tasks.filter(t => t.status === 'done').length}`)
console.log(`   - In Progress: ${realPayload.tasks.filter(t => t.status === 'in_progress').length}`)
console.log(`   - Todo: ${realPayload.tasks.filter(t => t.status === 'todo').length}`)
console.log(`✅ Total Images: ${realPayload.tasks.reduce((sum, t) => sum + t.imageCount, 0)}`)
console.log(`✅ Zalo Status: ${realPayload.project.zalo_status}`)
console.log(`✅ Assigned Staff: ${realPayload.project.assigned_staff.length}`)
console.log('\n✅ Payload ready for webhook submission!')
console.log(`📤 Send to: https://yi7a1c8g.rpcld.co/webhook-test/...`)
console.log('\n')
