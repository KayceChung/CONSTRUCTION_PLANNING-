import { Project, Task, TaskStatus } from '../types'
import { calculateProjectProgress } from './progress'

export async function sendWebhook(
  project: Project,
  task: Task,
  event: 'task_created' | 'status_changed' | 'image_uploaded',
  previousStatus?: TaskStatus
): Promise<void> {
  if (!project.webhookUrl) return

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
      weight: task.weight
    }
  }

  try {
    const response = await fetch(project.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook lỗi ${response.status}`)
    }
  } catch (firstError) {
    console.error('Webhook lần 1 thất bại:', firstError)
    try {
      await fetch(project.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (secondError) {
      console.error('Webhook lần 2 thất bại:', secondError)
    }
  }
}
