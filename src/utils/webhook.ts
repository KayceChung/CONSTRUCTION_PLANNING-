import { Customer, Project, Task, TaskStatus } from '../types'
import { calculateProjectProgress } from './progress'

const CUSTOMER_CREATED_WEBHOOK_URL = import.meta.env.VITE_CUSTOMER_CREATED_WEBHOOK_URL || 'https://yi7a1c8g.rpcld.co/webhook/b1632ac8-f6b2-493e-a868-64ad461b91f1'

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

export async function sendCustomerCreatedWebhook(customer: Customer): Promise<void> {
  if (!CUSTOMER_CREATED_WEBHOOK_URL) return

  const payload = {
    event: 'customer_created',
    timestamp: new Date().toISOString(),
    customer: {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      phone2: customer.phone2 || null,
      email: customer.email || null,
      address: customer.address || null,
      source: customer.source || null,
      status: customer.status || 'lead',
      note: customer.note || null,
      notes: customer.notes || null,
      zaloThreadId: customer.zaloThreadId || null,
      projectIds: customer.projectIds,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt || null
    }
  }

  try {
    await postJsonWebhook(CUSTOMER_CREATED_WEBHOOK_URL, payload)
  } catch (firstError) {
    console.error('Webhook customer_created lần 1 thất bại:', firstError)
    try {
      await postJsonWebhook(CUSTOMER_CREATED_WEBHOOK_URL, payload)
    } catch (secondError) {
      console.error('Webhook customer_created lần 2 thất bại:', secondError)
    }
  }
}

export async function sendWebhook(
  project: Project,
  task: Task,
  event: 'task_created' | 'status_changed' | 'image_uploaded',
  previousStatus?: TaskStatus
): Promise<void> {
  if (!project.webhookUrl) return

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
      progress: calculateProjectProgress(project)
    },
    task: {
      id: task.id,
      title: task.title,
      previousStatus: previousStatus || null,
      newStatus: task.status,
      note: task.note || '',
      updatedBy: task.updatedBy,
      images: task.images,
      deadline: task.deadline,
      estimatedDays: task.estimatedDays,
      startDate: task.startDate || null,
      actualDays: task.actualDays ?? null,
      isOverdue,
      daysRemaining
    }
  }

  try {
    await postJsonWebhook(project.webhookUrl, payload)
  } catch (firstError) {
    console.error('Webhook lần 1 thất bại:', firstError)
    try {
      await postJsonWebhook(project.webhookUrl, payload)
    } catch (secondError) {
      console.error('Webhook lần 2 thất bại:', secondError)
    }
  }
}
