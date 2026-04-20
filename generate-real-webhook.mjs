// Script to generate accurate webhook payload with real project & task data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eqhjwicfoyypminlruyo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaGp3aWNmb3l5cG1pbmxydXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1ODEzMjksImV4cCI6MjA5MjE1NzMyOX0.IAPZt2HMfHHCalvYk9irfSrT1OjEO--Zsi2-l6Rw5EY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateRealWebhookPayload() {
  try {
    console.log('[*] Connecting to Supabase...')
    
    // Fetch real projects
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (projectError || !projects || projects.length === 0) {
      console.error('❌ Error fetching projects:', projectError)
      return
    }
    
    const project = projects[0]
    console.log(`[✓] Found project: ${project.name}`)
    
    // Fetch real tasks for this project
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .limit(1)
    
    if (taskError || !tasks || tasks.length === 0) {
      console.log('[!] No tasks found for this project')
    }
    
    const task = tasks && tasks.length > 0 ? tasks[0] : null
    
    if (task) {
      console.log(`[✓] Found task: ${task.title}`)
    }
    
    // Calculate project progress
    const completedCount = (projects[0].tasks || []).filter(t => t.status === 'done').length
    const progress = Math.round((completedCount / Math.max(1, (projects[0].tasks || []).length)) * 100)
    
    const payload = {
      event: 'status_changed',
      timestamp: new Date().toISOString(),
      source: 'ConstructTrack - Real Data',
      project: {
        id: project.id,
        name: project.name,
        location: project.location,
        client: project.client,
        category: project.category,
        contractValue: project.contractValue,
        paidAmount: project.paidAmount,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: progress,
        taskCount: (projects[0].tasks || []).length,
        completedCount: completedCount,
        webhookUrl: project.webhookUrl || 'Not configured',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      task: task ? {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        note: task.note || '',
        updatedBy: task.updatedBy,
        updatedAt: task.updatedAt,
        createdAt: task.createdAt,
        deadline: task.deadline,
        estimatedDays: task.estimatedDays,
        startDate: task.startDate || null,
        completedAt: task.completedAt || null,
        actualDays: task.actualDays || null,
        images: (task.images || []).length,
        assignee: task.assignee || null,
        order: task.order,
        fromTemplateId: task.fromTemplateId || null
      } : null
    }
    
    console.log('\n[✓] Generated Webhook Payload:')
    console.log('================================================')
    console.log(JSON.stringify(payload, null, 2))
    console.log('================================================\n')
    
    // Send webhook test
    const webhookUrl = 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435'
    
    console.log('[*] Sending webhook to:', webhookUrl)
    console.log('[*] Sending...\n')
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    const responseData = await response.text()
    
    console.log(`[✓] Status Code: ${response.status}`)
    console.log(`[✓] Response: ${responseData}`)
    
    if (response.status === 200) {
      console.log('\n✅ Webhook sent successfully with real project & task data!')
    } else {
      console.log('\n⚠️ Webhook sent but received non-200 status')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

generateRealWebhookPayload()
