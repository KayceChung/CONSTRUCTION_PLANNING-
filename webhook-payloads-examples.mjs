/**
 * Realistic Webhook Payload Generator for ConstructTrack
 * Based on app schema and structure
 */

const realPayloads = {
  // Example 1: Project with multiple tasks
  project_1: {
    id: 'proj-chung-kien-001',
    name: 'Chung Kiến xây nhà',
    location: 'Hà Nội',
    client: 'Khách hàng: Nguyễn Văn A',
    category: 'new_construction',
    contractValue: 500000000,
    paidAmount: 250000000,
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    webhookUrl: 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-21T10:30:00Z'
  },

  // Example Tasks for above project
  tasks_project_1: [
    {
      id: 'task-001',
      title: 'Xây dựng nền móng',
      description: 'Đào sâu, rót bê tông nền theo thiết kế',
      status: 'in_progress',
      note: 'Đã hoàn thành 70%, đợi kiểm duyệt kỹ thuật',
      updatedBy: 'Nguyễn Văn B',
      updatedAt: '2026-04-20T14:30:00Z',
      createdAt: '2026-04-01T09:00:00Z',
      deadline: '2026-04-25',
      estimatedDays: 10,
      startDate: '2026-04-15',
      completedAt: null,
      actualDays: null,
      images: 5,
      assignee: 'Trần Văn C',
      order: 1,
      fromTemplateId: null
    },
    {
      id: 'task-002',
      title: 'Xây tường chính',
      description: 'Xây tường chính 4 tầng bằng gạch và vữa',
      status: 'todo',
      note: 'Chờ hoàn thành nền móng',
      updatedBy: 'Nguyễn Văn B',
      updatedAt: '2026-04-18T10:00:00Z',
      createdAt: '2026-04-02T10:00:00Z',
      deadline: '2026-05-15',
      estimatedDays: 20,
      startDate: null,
      completedAt: null,
      actualDays: null,
      images: 0,
      assignee: 'Nguyễn Văn D',
      order: 2,
      fromTemplateId: null
    },
    {
      id: 'task-003',
      title: 'Lắp đặt kết cấu mái',
      description: 'Lắp đặt dầm thép và kết cấu mái',
      status: 'done',
      note: 'Đã hoàn thành và qua kiểm duyệt',
      updatedBy: 'Nguyễn Văn E',
      updatedAt: '2026-04-10T16:00:00Z',
      createdAt: '2026-03-20T09:00:00Z',
      deadline: '2026-04-10',
      estimatedDays: 15,
      startDate: '2026-03-25',
      completedAt: '2026-04-10',
      actualDays: 16,
      images: 8,
      assignee: 'Lê Văn F',
      order: 3,
      fromTemplateId: null
    }
  ],

  // Example 2: Status change webhook payload (từ todo → in_progress)
  status_changed_payload: {
    event: 'status_changed',
    timestamp: new Date().toISOString(),
    source: 'ConstructTrack App',
    message: 'Đầu việc thay đổi trạng thái từ todo sang in_progress',
    project: {
      id: 'proj-chung-kien-001',
      name: 'Chung Kiến xây nhà',
      location: 'Hà Nội',
      client: 'Nguyễn Văn A',
      category: 'new_construction',
      contractValue: 500000000,
      paidAmount: 250000000,
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      progress: 55,
      taskCount: 3,
      completedCount: 1,
      webhookUrl: 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435'
    },
    task: {
      id: 'task-002',
      title: 'Xây tường chính',
      description: 'Xây tường chính 4 tầng bằng gạch và vữa',
      previousStatus: 'todo',
      newStatus: 'in_progress',
      note: 'Bắt đầu thi công - Nền móng đã sẵn sàng',
      updatedBy: 'Nguyễn Văn B',
      updatedAt: new Date().toISOString(),
      createdAt: '2026-04-02T10:00:00Z',
      deadline: '2026-05-15',
      estimatedDays: 20,
      startDate: '2026-04-21',
      completedAt: null,
      actualDays: null,
      images: 0,
      assignee: 'Nguyễn Văn D',
      order: 2,
      fromTemplateId: null,
      isOverdue: false,
      daysRemaining: 24
    }
  },

  // Example 3: Task completed webhook payload (in_progress → done)
  task_completed_payload: {
    event: 'status_changed',
    timestamp: new Date().toISOString(),
    source: 'ConstructTrack App',
    message: 'Đầu việc hoàn thành',
    project: {
      id: 'proj-chung-kien-001',
      name: 'Chung Kiến xây nhà',
      location: 'Hà Nội',
      client: 'Nguyễn Văn A',
      category: 'new_construction',
      contractValue: 500000000,
      paidAmount: 250000000,
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      progress: 70,
      taskCount: 3,
      completedCount: 2,
      webhookUrl: 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435'
    },
    task: {
      id: 'task-001',
      title: 'Xây dựng nền móng',
      description: 'Đào sâu, rót bê tông nền theo thiết kế',
      previousStatus: 'in_progress',
      newStatus: 'done',
      note: 'Hoàn thành 100%, đã qua kiểm duyệt kỹ thuật',
      updatedBy: 'Nguyễn Văn B',
      updatedAt: new Date().toISOString(),
      createdAt: '2026-04-01T09:00:00Z',
      deadline: '2026-04-25',
      estimatedDays: 10,
      startDate: '2026-04-15',
      completedAt: '2026-04-24',
      actualDays: 9,
      images: 5,
      assignee: 'Trần Văn C',
      order: 1,
      fromTemplateId: null,
      isOverdue: false,
      daysRemaining: 0
    }
  }
}

// Log all payloads
console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║   CONSTRUCTTRACK - REALISTIC WEBHOOK PAYLOADS                  ║')
console.log('║   Based on actual app schema & structure                       ║')
console.log('╚════════════════════════════════════════════════════════════════╝')
console.log()

// Project info
console.log('📋 PROJECT EXAMPLE:')
console.log('─'.repeat(70))
console.log(JSON.stringify(realPayloads.project_1, null, 2))
console.log()

// Tasks info
console.log('📋 TASKS FOR PROJECT:')
console.log('─'.repeat(70))
realPayloads.tasks_project_1.forEach((task, index) => {
  console.log(`\n Task ${index + 1}:`)
  console.log(JSON.stringify(task, null, 2))
})
console.log()

// Status change example
console.log('🔔 WEBHOOK PAYLOAD - STATUS CHANGE (todo → in_progress):')
console.log('─'.repeat(70))
console.log(JSON.stringify(realPayloads.status_changed_payload, null, 2))
console.log()

// Task completion example
console.log('🔔 WEBHOOK PAYLOAD - TASK COMPLETED (in_progress → done):')
console.log('─'.repeat(70))
console.log(JSON.stringify(realPayloads.task_completed_payload, null, 2))
console.log()

// Copy to clipboard utility
console.log('💾 HOW TO USE:')
console.log('─'.repeat(70))
console.log('1. Copy any payload above')
console.log('2. Use in your webhook receiver (e.g., n8n, Zapier, etc.)')
console.log('3. Test with the test webhook button in the app')
console.log('4. Or call: https://yi7a1c8g.rpcld.co/webhook-test/...')
console.log()

// Send to webhook
async function sendPayload(payload, name) {
  const webhookUrl = 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435'
  
  try {
    console.log(`📤 Sending: ${name}...`)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    const data = await response.text()
    console.log(`✅ Status: ${response.status}`)
    console.log(`✅ Response: ${data}`)
    console.log()
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
  }
}

// Send all examples
console.log('📤 SENDING WEBHOOKS TO TEST ENDPOINT...')
console.log('═'.repeat(70))
console.log()

Promise.all([
  sendPayload(realPayloads.status_changed_payload, 'Status Change (todo → in_progress)'),
  sendPayload(realPayloads.task_completed_payload, 'Task Completed (in_progress → done)')
]).then(() => {
  console.log('✅ All webhooks sent successfully!')
  console.log()
  console.log('📌 Note: Use these payloads as reference for:')
  console.log('   - Setting up your webhook receiver')
  console.log('   - Testing integrations')
  console.log('   - Understanding data structure')
}).catch(error => {
  console.error('❌ Error sending webhooks:', error)
})
