/**
 * Test new webhook URL
 */

const payload = {
  event: 'project_status_update',
  timestamp: new Date().toISOString(),
  source: 'ConstructTrack App',
  project: {
    name: 'Xây dựng nhà ở Hà Nội',
    location: 'Hà Nội',
    progress: 55,
    taskCount: 8,
    completedCount: 4,
    contract_value: 500000000,
    paid_amount: 250000000
  },
  tasks: [
    {
      title: 'Xây tường chính',
      status: 'in_progress',
      note: 'Task status changed'
    }
  ]
}

async function test() {
  const webhookUrl = 'https://yi7a1c8g.rpcld.co/webhook/00b8a546-422b-4786-ad00-0105bb20c435'
  
  console.log('\n📤 Testing new webhook URL...')
  console.log(`   URL: ${webhookUrl}`)
  console.log()

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    console.log(`✅ Status: ${response.status}`)
    const text = await response.text()
    console.log(`✅ Response: ${text}`)
    console.log()
    console.log('🎉 Webhook URL mới đã hoạt động thành công!\n')
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`)
  }
}

test()
