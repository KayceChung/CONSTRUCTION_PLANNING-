/**
 * Prepare Real Webhook Payload from Supabase
 * Using actual database schema for projects & tasks
 */

import { createClient } from '@supabase/supabase-js'

// Supabase config
const SUPABASE_URL = 'https://nxjlzcfyfqrqsdvpzfro.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54amx6Y2Z5ZnFycXNkdnB6ZnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDczNTc4MDYsImV4cCI6MTg2NTEyMzgwNn0.Ri8Fh2TwpCrKyDMlrNLYNSCgJgFqpSYJ-QMbgVKngMQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function prepareWebhookPayload() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗')
    console.log('║   PREPARE REAL WEBHOOK PAYLOAD FROM SUPABASE                   ║')
    console.log('╚════════════════════════════════════════════════════════════════╝\n')

    // 1. Fetch one project
    console.log('[1/3] Fetching project from database...')
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)

    if (projectError) {
      console.error('❌ Error fetching projects:', projectError)
      return
    }

    if (!projects || projects.length === 0) {
      console.error('❌ No projects found in database')
      return
    }

    const project = projects[0]
    console.log(`✅ Found project: "${project.name}"`)
    console.log(`   ID: ${project.id}`)
    console.log(`   Client: ${project.client}`)
    console.log(`   Location: ${project.location}`)

    // 2. Fetch tasks for this project
    console.log('\n[2/3] Fetching tasks for this project...')
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError)
      return
    }

    console.log(`✅ Found ${tasks?.length || 0} tasks`)
    tasks?.slice(0, 3).forEach((task, idx) => {
      console.log(`   Task ${idx + 1}: "${task.title}" (${task.status})`)
    })

    // 3. Calculate project statistics
    console.log('\n[3/3] Calculating project statistics...')
    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
    const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    console.log(`✅ Progress: ${completedTasks}/${totalTasks} completed (${progress}%)`)

    // 4. Build webhook payload
    console.log('\n[4/4] Building webhook payload...')
    
    const payload = {
      event: 'project_status_update',
      timestamp: new Date().toISOString(),
      source: 'ConstructTrack App',
      
      project: {
        id: project.id,
        name: project.name,
        location: project.location,
        client: project.client,
        customer_id: project.customer_id,
        category: project.category,
        category_note: project.category_note,
        
        // Address info
        address_full: project.address_full,
        address_ward: project.address_ward,
        address_district: project.address_district,
        address_province: project.address_province,
        address_google_maps_url: project.address_google_maps_url,
        
        // Financial info
        contract_value: project.contract_value,
        paid_amount: project.paid_amount,
        payment_note: project.payment_note,
        distance_km: project.distance_km,
        
        // Timeline
        start_date: project.start_date,
        end_date: project.end_date,
        
        // Progress
        progress: progress,
        taskCount: totalTasks,
        completedCount: completedTasks,
        inProgressCount: inProgressTasks,
        todoCount: totalTasks - completedTasks - inProgressTasks,
        
        // Staff & settings
        assigned_staff: project.assigned_staff || [],
        project_type_id: project.project_type_id,
        notes: project.notes,
        
        // Zalo integration
        zalo_group_thread_id: project.zalo_group_thread_id,
        zalo_group_name: project.zalo_group_name,
        zalo_linked_at: project.zalo_linked_at,
        zalo_status: project.zalo_status,
        
        // Webhook config
        webhook_url: project.webhook_url,
        
        // Timestamps
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      
      tasks: tasks?.map(task => ({
        id: task.id,
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        status: task.status,
        
        // Images (real array of URLs)
        images: task.images || [],
        imageCount: task.images?.length || 0,
        
        // Timeline
        deadline: task.deadline,
        task_deadline: task.task_deadline,
        estimated_days: task.estimated_days,
        start_date: task.start_date,
        completed_at: task.completed_at,
        actual_days: task.actual_days,
        
        // Assignment & tracking
        updated_by: task.updated_by,
        assignee: task.assignee,
        note: task.note,
        sort_order: task.sort_order,
        from_template_id: task.from_template_id,
        
        // Timestamps
        created_at: task.created_at,
        updated_at: task.updated_at
      })) || []
    }

    console.log('✅ Payload built successfully')

    // 5. Display payload
    console.log('\n' + '═'.repeat(70))
    console.log('📋 WEBHOOK PAYLOAD READY FOR SENDING:')
    console.log('═'.repeat(70) + '\n')
    
    console.log(JSON.stringify(payload, null, 2))

    // 6. Send to webhook
    console.log('\n' + '═'.repeat(70))
    console.log('📤 SENDING TO WEBHOOK ENDPOINT...')
    console.log('═'.repeat(70) + '\n')

    const webhookUrl = 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435'
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const responseText = await response.text()
      
      console.log(`📤 Sent to: ${webhookUrl}`)
      console.log(`✅ Status: ${response.status}`)
      console.log(`✅ Response: ${responseText}`)
    } catch (error) {
      console.error(`❌ Webhook send error: ${error.message}`)
    }

    // 7. Summary
    console.log('\n' + '═'.repeat(70))
    console.log('📌 SUMMARY:')
    console.log('═'.repeat(70))
    console.log(`✅ Project: ${project.name}`)
    console.log(`✅ Tasks: ${totalTasks} (${completedTasks} done, ${inProgressTasks} in progress)`)
    console.log(`✅ Progress: ${progress}%`)
    console.log(`✅ Address: ${project.address_full}`)
    console.log(`✅ Contract Value: ${project.contract_value.toLocaleString('vi-VN')} VND`)
    console.log(`✅ Paid: ${project.paid_amount.toLocaleString('vi-VN')} VND`)
    console.log(`✅ Payload fields: ${Object.keys(payload).length}`)
    console.log(`✅ Project fields: ${Object.keys(payload.project).length}`)
    console.log(`✅ Task fields: ${payload.tasks[0] ? Object.keys(payload.tasks[0]).length : 0}`)
    console.log('\n')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run
prepareWebhookPayload()
