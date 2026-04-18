import { WEBHOOK_CONFIG } from '../config/webhooks'
import { buildNotificationMessage, NotificationEvent } from './notification-templates'
import { Project, Customer } from '../types'

// ─── Type Definitions ────────────────────────────────────────────────

export interface CreateZaloGroupPayload {
  event: 'project.created'
  project: {
    id: string
    name: string
    projectType: string
    location: string
    startDate: string
    deadline: string
    contractValue: number
    managerName: string
  }
  client: {
    name: string
    phone: string
  }
  timestamp: string
}

export interface CreateZaloGroupResponse {
  success: boolean
  zaloGroupThreadId?: string
  zaloGroupName?: string
  message?: string
  error?: string
}

export interface SendNotificationPayload {
  event: NotificationEvent
  zaloGroupThreadId: string
  projectId: string
  projectName: string
  message: string
  metadata: Record<string, any>
  timestamp: string
}

// ─── Function 1: Create Zalo Group ──────────────────────────────────

export async function createZaloGroupForProject(
  project: Project,
  client: Customer,
  managerName: string
): Promise<CreateZaloGroupResponse> {
  const baseUrl = WEBHOOK_CONFIG.N8N_BASE_URL
  const endpoint = WEBHOOK_CONFIG.ENDPOINTS.CREATE_PROJECT_GROUP

  if (!baseUrl) {
    return {
      success: false,
      error: 'N8N webhook URL không được cấu hình. Vui lòng thiết lập VITE_N8N_WEBHOOK_URL.',
    }
  }

  const url = baseUrl + endpoint

  const payload: CreateZaloGroupPayload = {
    event: 'project.created',
    project: {
      id: project.id,
      name: project.name,
      projectType: project.projectTypeId || 'Unknown',
      location: project.location,
      startDate: project.startDate,
      deadline: project.endDate,
      contractValue: project.contractValue,
      managerName,
    },
    client: {
      name: client.fullName,
      phone: client.phone,
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.TIMEOUT)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return {
      success: data.success ?? false,
      zaloGroupThreadId: data.zaloGroupThreadId,
      zaloGroupName: data.zaloGroupName,
      message: data.message,
      error: data.error,
    }
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError'
    return {
      success: false,
      error: isTimeout
        ? 'Timeout — n8n không phản hồi trong 15 giây'
        : err.message || 'Lỗi không xác định',
    }
  }
}

// ─── Function 2: Send Notification ──────────────────────────────────

export async function sendZaloNotification(
  project: Project,
  event: NotificationEvent,
  eventData: Record<string, any>
): Promise<void> {
  // Silent ignore if project doesn't have a group
  if (!project.zaloGroupThreadId) {
    return
  }

  const baseUrl = WEBHOOK_CONFIG.N8N_BASE_URL
  const endpoint = WEBHOOK_CONFIG.ENDPOINTS.SEND_NOTIFICATION

  if (!baseUrl) {
    console.warn('[Zalo] N8N webhook URL not configured')
    return
  }

  const url = baseUrl + endpoint

  const message = buildNotificationMessage(event, {
    projectName: project.name,
    ...eventData,
  })

  const payload: SendNotificationPayload = {
    event,
    zaloGroupThreadId: project.zaloGroupThreadId,
    projectId: project.id,
    projectName: project.name,
    message,
    metadata: eventData,
    timestamp: new Date().toISOString(),
  }

  try {
    // Fire-and-forget: non-blocking notification
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('[Zalo] Failed to send notification:', event, project.id, err)
    })
  } catch (err) {
    console.warn('[Zalo] Failed to send notification:', event, project.id, err)
  }
}

// ─── Scheduler: Check Deadline Warnings ──────────────────────────────

export function checkDeadlineWarnings(projects: Project[]): void {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  projects.forEach((project) => {
    // Only check if project has Zalo group linked
    if (!project.zaloGroupThreadId) {
      return
    }

    project.tasks?.forEach((task) => {
      // Skip completed or cancelled tasks
      if (task.status === 'done' || task.status === 'cancelled' || !task.deadline) {
        return
      }

      const deadlineDate = new Date(task.deadline)
      deadlineDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor(
        (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Task is overdue
      if (diffDays < 0) {
        sendZaloNotification(project, 'task.overdue', {
          taskTitle: task.title,
          deadline: task.deadline,
          daysOverdue: Math.abs(diffDays),
          status: task.status,
        })
      }
      // Task deadline in next 3 days
      else if (diffDays <= 3 && diffDays >= 0) {
        sendZaloNotification(project, 'task.deadline_warning', {
          taskTitle: task.title,
          deadline: task.deadline,
          daysLeft: diffDays,
          status: task.status,
        })
      }
    })
  })
}
