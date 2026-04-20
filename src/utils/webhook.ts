import { Project, Task, TaskStatus } from '../types'
import { calculateProjectProgress } from './progress'
import { WEBHOOK_CONFIG } from '../config/webhooks'

async function postJsonWebhook(url: string, payload: unknown): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Webhook lỗi ${response.status}`)
  }
}

export async function sendWebhook(
  project: Project,
  task: Task,
  event: 'task_created' | 'status_changed' | 'image_uploaded',
  previousStatus?: TaskStatus
): Promise<void> {
  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const today = new Date()
  const daysRemaining = deadlineDate ? Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
  const isOverdue = daysRemaining !== null ? daysRemaining < 0 && task.status !== 'done' : false

  const payload = {
    event,
    timestamp: new Date().toISOString(),
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
      progress: calculateProjectProgress(project),
      taskCount: project.tasks.length,
      completedCount: project.tasks.filter(t => t.status === 'done').length
    },
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      previousStatus: previousStatus || null,
      newStatus: task.status,
      note: task.note || '',
      updatedBy: task.updatedBy,
      updatedAt: task.updatedAt,
      createdAt: task.createdAt,
      images: task.images.length,
      deadline: task.deadline,
      estimatedDays: task.estimatedDays,
      startDate: task.startDate || null,
      completedAt: task.completedAt || null,
      actualDays: task.actualDays ?? null,
      isOverdue,
      daysRemaining,
      assignee: task.assignee || null
    }
  }

  // Send to default webhook URL (always)
  try {
    await postJsonWebhook(WEBHOOK_CONFIG.DEFAULT_TASK_WEBHOOK, payload)
    console.log('✅ Webhook mặc định gửi thành công')
  } catch (firstError) {
    console.error('❌ Webhook mặc định lần 1 thất bại:', firstError)
    try {
      await postJsonWebhook(WEBHOOK_CONFIG.DEFAULT_TASK_WEBHOOK, payload)
      console.log('✅ Webhook mặc định gửi thành công (lần 2)')
    } catch (secondError) {
      console.error('❌ Webhook mặc định lần 2 thất bại:', secondError)
    }
  }

  // Send to project-specific webhook URL if configured
  if (project.webhookUrl && project.webhookUrl !== WEBHOOK_CONFIG.DEFAULT_TASK_WEBHOOK) {
    try {
      await postJsonWebhook(project.webhookUrl, payload)
      console.log('✅ Webhook tùy chỉnh gửi thành công')
    } catch (firstError) {
      console.error('❌ Webhook tùy chỉnh lần 1 thất bại:', firstError)
      try {
        await postJsonWebhook(project.webhookUrl, payload)
        console.log('✅ Webhook tùy chỉnh gửi thành công (lần 2)')
      } catch (secondError) {
        console.error('❌ Webhook tùy chỉnh lần 2 thất bại:', secondError)
      }
    }
  }
}
