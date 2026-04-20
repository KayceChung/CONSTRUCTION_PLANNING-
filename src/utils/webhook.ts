import { Project, Task, TaskStatus } from '../types'
import { calculateProjectProgress } from './progress'
import { WEBHOOK_CONFIG } from '../config/webhooks'
import { supabase } from './supabase'

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

/**
 * Convert base64 image to public Supabase URL
 * Nếu ảnh đã là URL (http/https), trả về nguyên
 * Nếu là base64 DataURL, upload lên Supabase và trả về public URL
 */
async function convertBase64ToUrl(base64String: string, projectId: string, taskId: string, index: number): Promise<string> {
  try {
    // Nếu đã là URL công khai, trả về nguyên
    if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
      return base64String
    }

    // Nếu là base64 DataURL, convert thành file và upload
    if (base64String.startsWith('data:')) {
      const [header, data] = base64String.split(',')
      const mimeMatch = header.match(/data:([^;]+)/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      const ext = mimeType.split('/')[1] || 'jpg'
      
      // Decode base64 to binary
      const binaryString = atob(data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mimeType })

      // Upload to Supabase
      const timestamp = Date.now()
      const fileName = `${projectId}/${taskId}/image-${timestamp}-${index}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-images')
        .upload(fileName, blob, { 
          upsert: false,
          contentType: mimeType
        })

      if (uploadError) {
        console.error('❌ Upload base64 ảnh thất bại:', uploadError)
        return base64String // Fallback: return base64 nếu upload thất bại
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('task-images')
        .getPublicUrl(uploadData.path)

      return publicUrlData.publicUrl
    }

    return base64String
  } catch (error) {
    console.error('❌ Error converting base64 to URL:', error)
    return base64String
  }
}

// Map task status to Vietnamese names
const statusMap: Record<string, string> = {
  'todo': 'Chưa bắt đầu',
  'in_progress': 'Đang thi công',
  'done': 'Hoàn thành',
  'adjustment': 'Điều chỉnh',
  'pending': 'Tạm dừng',
  'cancelled': 'Hủy bỏ'
}

// Map project category to name
const categoryMap: Record<string, string> = {
  'new_construction': 'New Construction',
  'renovation': 'Renovation',
  'other': 'Other'
}

export async function sendWebhook(
  project: Project & { projectType?: { name: string } },
  task: Task,
  event: 'task_created' | 'status_changed' | 'image_uploaded',
  previousStatus?: TaskStatus
): Promise<void> {
  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const today = new Date()
  const daysRemaining = deadlineDate ? Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
  const isOverdue = daysRemaining !== null ? daysRemaining < 0 && task.status !== 'done' : false

  // Get category name: from projectType if available, otherwise use categoryMap
  const categoryName = project.projectType?.name || categoryMap[project.category] || project.category

  // Convert base64 images to public URLs for Zalo
  const publicImageUrls = await Promise.all(
    (task.images || []).map((img, index) => convertBase64ToUrl(img, project.id, task.id, index))
  )

  // Filter valid URLs only
  const imageUrlsArray = publicImageUrls.filter(url => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  })

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      location: project.location,
      client: project.client,
      category: categoryName,
      contractValue: project.contractValue,
      paidAmount: project.paidAmount,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: calculateProjectProgress(project),
      taskCount: project.tasks.length,
      zaloGroupThreadId: project.zaloGroupThreadId || null,
      zaloGroupName: project.zaloGroupName || null,
      zaloStatus: project.zaloStatus || null,
      completedCount: project.tasks.filter(t => t.status === 'done').length
    },
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      previousStatus: previousStatus ? statusMap[previousStatus] || previousStatus : null,
      newStatus: statusMap[task.status] || task.status,
      note: task.note || '',
      updatedBy: task.updatedBy,
      updatedAt: task.updatedAt,
      createdAt: task.createdAt,
      images: imageUrlsArray.length,
      imageUrls: imageUrlsArray,
      imageUrlsCsv: imageUrlsArray.join(','),
      imageUrlsJson: imageUrlsArray,
      hasImages: imageUrlsArray.length > 0,
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

/**
 * Gửi webhook test/mẫu để kiểm tra cấu hình
 */
export async function sendTestWebhook(project: Project & { projectType?: { name: string } }): Promise<void> {
  // Get category name: from projectType if available, otherwise use categoryMap
  const categoryName = project.projectType?.name || categoryMap[project.category] || project.category

  const samplePayload = {
    event: 'status_changed',
    timestamp: new Date().toISOString(),
    isTestPayload: true,
    message: '🧪 Đây là payload kiểm tra webhook. Bạn có thể sử dụng mẫu này để kiểm tra hệ thống nhận webhook của mình.',
    project: {
      id: project.id,
      name: project.name,
      location: project.location,
      client: project.client,
      category: categoryName,
      contractValue: project.contractValue,
      paidAmount: project.paidAmount,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: calculateProjectProgress(project),
      taskCount: project.tasks.length,
      zaloGroupThreadId: project.zaloGroupThreadId || null,
      zaloGroupName: project.zaloGroupName || null,
      zaloStatus: project.zaloStatus || null,
      completedCount: project.tasks.filter(t => t.status === 'done').length
    },
    task: {
      id: 'task-sample-001',
      title: 'Ví dụ: Xây dựng nền móng (Webhook Test)',
      description: 'Đây là một mẫu thông tin đầu việc được gửi qua webhook',
      previousStatus: 'Chưa bắt đầu',
      newStatus: 'Đang thi công',
      note: '🧪 Webhook test payload - Kiểm tra kết nối',
      updatedBy: 'System Test',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      images: 0,
      imageUrls: [],
      imageUrlsCsv: '',
      imageUrlsJson: [],
      hasImages: false,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      estimatedDays: 10,
      startDate: new Date().toISOString().slice(0, 10),
      completedAt: null,
      actualDays: null,
      isOverdue: false,
      daysRemaining: 10,
      assignee: null
    }
  }

  // Send to default webhook
  try {
    await postJsonWebhook(WEBHOOK_CONFIG.DEFAULT_TASK_WEBHOOK, samplePayload)
    console.log('✅ Test webhook mặc định gửi thành công')
  } catch (error) {
    console.error('❌ Test webhook mặc định thất bại:', error)
    throw error
  }

  // Send to project webhook if different from default
  if (project.webhookUrl && project.webhookUrl !== WEBHOOK_CONFIG.DEFAULT_TASK_WEBHOOK) {
    try {
      await postJsonWebhook(project.webhookUrl, samplePayload)
      console.log('✅ Test webhook tùy chỉnh gửi thành công')
    } catch (error) {
      console.error('❌ Test webhook tùy chỉnh thất bại:', error)
      throw error
    }
  }
}
