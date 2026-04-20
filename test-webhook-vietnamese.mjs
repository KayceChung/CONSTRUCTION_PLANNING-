/**
 * Test Webhook with Vietnamese Status Names
 */

async function testWebhook() {
  const payload = {
    event: 'status_changed',
    timestamp: new Date().toISOString(),
    source: 'ConstructTrack App',
    
    project: {
      id: 'proj-001',
      name: 'Xây dựng nhà ở Hà Nội',
      location: 'Hà Nội',
      client: 'Nguyễn Văn A',
      category: 'Nhà ở',
      contractValue: 500000000,
      paidAmount: 250000000,
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      progress: 55,
      taskCount: 8,
      completedCount: 4,
      inProgressCount: 3,
      todoCount: 1,
      address_full: '123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
      address_province: 'Hà Nội'
    },
    
    task: {
      id: 'task-002',
      title: 'Xây tường chính',
      description: 'Xây tường chính 4 tầng bằng gạch và vữa cement',
      previousStatus: 'Chưa bắt đầu',
      newStatus: 'Đang thi công',
      note: 'Bắt đầu thi công - Nền móng đã sẵn sàng',
      updatedBy: 'Nguyễn Văn B',
      updatedAt: new Date().toISOString(),
      createdAt: '2026-04-02T10:00:00Z',
      deadline: '2026-05-15',
      estimatedDays: 20,
      startDate: '2026-04-21',
      completedAt: null,
      actualDays: null,
      images: 2,
      assignee: 'Nguyễn Văn D',
      isOverdue: false,
      daysRemaining: 24
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   TEST WEBHOOK PAYLOAD                                         ║')
  console.log('║   With Vietnamese Status Names                                 ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  const webhookUrl = 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435'

  console.log('📤 Webhook URL:')
  console.log(`   ${webhookUrl}\n`)

  console.log('📋 Payload:')
  console.log(JSON.stringify(payload, null, 2))
  console.log()

  try {
    console.log('[*] Sending payload...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()

    console.log('═'.repeat(70))
    console.log('✅ Response Received:')
    console.log('═'.repeat(70))
    console.log(`Status Code: ${response.status}`)
    console.log(`Response: ${responseText}`)
    console.log()
    console.log('✅ Webhook test thành công!\n')

  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`)
  }
}

testWebhook()
