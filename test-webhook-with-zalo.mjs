const WEBHOOK_URL = 'https://yi7a1c8g.rpcld.co/webhook/00b8a546-422b-4786-ad00-0105bb20c435'

const testPayload = {
  event: 'status_changed',
  timestamp: new Date().toISOString(),
  project: {
    id: 'proj-123',
    name: 'Xây dựng nhà ở Hà Nội',
    location: 'Hà Nội',
    client: 'Công ty ABC',
    category: 'Nhà ở',
    contractValue: 500000000,
    paidAmount: 250000000,
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    progress: 55,
    taskCount: 8,
    zaloGroupThreadId: 'zalo_thread_group_12345',
    zaloGroupName: 'Nhóm Công Trình Hà Nội',
    zaloStatus: 'active',
    completedCount: 4
  },
  task: {
    id: 'task-789',
    title: 'Xây dựng nền móng',
    description: 'Khoan cọc và lập dàn khung',
    previousStatus: 'Chưa bắt đầu',
    newStatus: 'Đang thi công',
    note: 'Đã bắt đầu công việc sáng nay',
    updatedBy: 'Kỹ sư Minh',
    updatedAt: new Date().toISOString(),
    createdAt: '2026-04-15T10:00:00Z',
    images: 3,
    deadline: '2026-05-15',
    estimatedDays: 20,
    startDate: '2026-04-20',
    completedAt: null,
    actualDays: null,
    isOverdue: false,
    daysRemaining: 25,
    assignee: 'Đội công nhân A'
  }
}

console.log('📤 Gửi webhook test...')
console.log('🔗 URL:', WEBHOOK_URL)
console.log('📋 Payload:')
console.log(JSON.stringify(testPayload, null, 2))
console.log('\n⏳ Đang chờ phản hồi...\n')

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  })

  console.log(`✅ HTTP Status: ${response.status}`)
  
  const responseText = await response.text()
  console.log(`📬 Response: ${responseText}`)
  
  if (response.ok) {
    console.log('\n🎉 Webhook test gửi thành công!')
    try {
      const jsonResponse = JSON.parse(responseText)
      console.log('📊 Response JSON:', jsonResponse)
    } catch (e) {
      // Response không phải JSON, không sao
    }
  } else {
    console.log('\n❌ Webhook test thất bại!')
  }
} catch (error) {
  console.error('\n❌ Lỗi gửi webhook:', error.message)
  process.exit(1)
}
