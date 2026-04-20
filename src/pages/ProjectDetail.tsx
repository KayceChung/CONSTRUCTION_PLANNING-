import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useAuthStore } from '../stores/useAuthStore'
import { useCustomerStore } from '../stores/useCustomerStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useProjectTypeStore } from '../stores/useProjectTypeStore'
import { useStaffStore } from '../stores/useStaffStore'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import TaskModal from '../components/modals/TaskModal'
import ConfirmModal from '../components/modals/ConfirmModal'
import CreateTaskModal from '../components/modals/CreateTaskModal'
import ProjectEditModal from '../components/modals/ProjectEditModal'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { calculateProjectProgress, formatDate, daysUntil } from '../utils/progress'
import { sendWebhook, sendTestWebhook } from '../utils/webhook'
import { exportProjectPdf } from '../utils/pdfReport'
import { compressImages, getBase64Size, formatFileSize } from '../utils/imageCompression'
import { sendZaloNotification, checkDeadlineWarnings, createZaloGroupForProject } from '../lib/webhook-service'
import { Project, Task, TaskStatus } from '../types'

interface ProjectDetailProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const statusLabel: Record<TaskStatus, string> = {
  todo: 'Chưa bắt đầu',
  in_progress: 'Đang thi công',
  done: 'Hoàn thành',
  adjustment: 'Điều chỉnh',
  pending: 'Tạm dừng',
  cancelled: 'Hủy bỏ'
}

export default function ProjectDetail({ showToast }: ProjectDetailProps) {
  const params = useParams()
  const navigate = useNavigate()
  const projectId = params.projectId || ''
  const user = useAuthStore((state) => state.user)
  const projects = useProjectStore((state) => state.projects)
  const updateTask = useProjectStore((state) => state.updateTask)
  const updateProject = useProjectStore((state) => state.updateProject)
  const addTask = useProjectStore((state) => state.addTask)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [sendingTestWebhook, setSendingTestWebhook] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'finance' | 'images' | 'logs'>('overview')

  const customers = useCustomerStore((state) => state.customers)
  const staff = useStaffStore((state) => state.staff)
  const projectTypes = useProjectTypeStore((state) => state.projectTypes)
  const project = useMemo(() => projects.find((item) => item.id === projectId) || null, [projects, projectId])
  const customer = useMemo(() => project ? customers.find((item) => item.id === project.customerId) || null : null, [customers, project])
  const assignedPersonnel = useMemo(
    () => staff.filter((item) => project?.assignedStaff.includes(item.id)),
    [project, staff]
  )
  
  // Helper: Get project with projectType data for webhook
  const getProjectWithType = (p: Project) => {
    const projectType = p.projectTypeId ? projectTypes.find((pt) => pt.id === p.projectTypeId) : undefined
    return {
      ...p,
      projectType: projectType ? { name: projectType.name } : undefined
    }
  }

  const calculateDeadline = (startDate: string, estimatedDays: number) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + Math.max(1, estimatedDays) - 1)
    return date.toISOString().slice(0, 10)
  }

  // Check deadline warnings when component mounts
  useEffect(() => {
    if (project && projects.length > 0) {
      checkDeadlineWarnings(projects)
    }
  }, [])

  // Initialize webhook URL from project
  useEffect(() => {
    if (project && project.webhookUrl) {
      setWebhookUrl(project.webhookUrl)
    }
  }, [project?.id])

  if (!project || !user) {

    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">Dự án không tồn tại.</p>
        <Button type="button" className="mt-4" onClick={() => navigate('/projects')}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const progress = calculateProjectProgress(project)
  const deadlineDays = daysUntil(project.endDate)

  const saveTaskChanges = async (changes: Partial<Task>) => {
    if (!selectedTask) return
    const previousStatus = selectedTask.status
    const updatedTask: Partial<Task> = {
      ...changes,
      updatedAt: new Date().toISOString(),
      updatedBy: user.name
    }
    if (changes.status === 'in_progress' && !changes.startDate && !selectedTask.startDate) {
      updatedTask.startDate = new Date().toISOString().slice(0, 10)
    }
    if (changes.status === 'done' && !changes.completedAt) {
      updatedTask.completedAt = new Date().toISOString().slice(0, 10)
    }
    if (updatedTask.startDate && updatedTask.completedAt) {
      const actualDays = Math.ceil((new Date(updatedTask.completedAt).getTime() - new Date(updatedTask.startDate).getTime()) / (1000 * 60 * 60 * 24))
      updatedTask.actualDays = actualDays > 0 ? actualDays : 0
    }
    updateTask(project.id, selectedTask.id, updatedTask)
    setSelectedTask(null)
    showToast('Cập nhật công việc thành công', 'success')
    const updatedProject = useProjectStore.getState().projects.find((item) => item.id === project.id)
    if (updatedProject) {
      sendWebhook(getProjectWithType(updatedProject), { ...selectedTask, ...updatedTask } as Task, 'status_changed', previousStatus).catch(() => {
        showToast('Webhook gửi thất bại', 'error')
      })
    }
  }

  const uploadImages = async (files: FileList) => {
    try {
      // Nén các ảnh trước khi lưu
      const compressedImages = await compressImages(files)
      
      if (!selectedTask) return

      // Tính toán kích thước gốc và kích thước sau nén
      const originalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0)
      const compressedSize = compressedImages.reduce((acc, img) => acc + getBase64Size(img), 0)
      const savedSize = originalSize - compressedSize
      const compressionRatio = originalSize > 0 ? Math.round(((savedSize / originalSize) * 100)) : 0

      // Thêm ảnh đã nén vào task
      const nextImages = [...selectedTask.images, ...compressedImages]
      updateTask(project.id, selectedTask.id, { images: nextImages })

      // Thông báo chi tiết về upload
      const message = `✅ Upload ${compressedImages.length} ảnh thành công!\n📁 Lưu vào: Supabase Database (bảng tasks)\n📊 Nén: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (tiết kiệm ${compressionRatio}%)`
      showToast(message, 'success')

      // Gửi webhook khi có ảnh được upload
      const updatedProject = useProjectStore.getState().projects.find((item) => item.id === project.id)
      if (updatedProject) {
        sendWebhook(getProjectWithType(updatedProject), { ...selectedTask, images: nextImages } as Task, 'image_uploaded').catch(() => {
          showToast('⚠️ Ảnh đã lưu nhưng webhook gửi thất bại', 'error')
        })
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      showToast('❌ Upload ảnh thất bại. Vui lòng thử lại.', 'error')
    }
  }

  const activeTaskCount = useMemo(() => project.tasks.filter((task) => task.status !== 'cancelled').length, [project.tasks])
  const nextWeight = activeTaskCount > 0 ? Math.round(100 / (activeTaskCount + 1)) : 0

  // Collect all images from all tasks
  const projectImages = useMemo(() => {
    if (!project || !project.tasks) return []
    const images: Array<{ id: string; taskId: string; taskTitle: string; imageData: string; uploadedAt?: string }> = []
    project.tasks.forEach((task) => {
      if (task.images && task.images.length > 0) {
        task.images.forEach((imageData, index) => {
          images.push({
            id: `${task.id}-${index}`,
            taskId: task.id,
            taskTitle: task.title,
            imageData,
            uploadedAt: task.updatedAt
          })
        })
      }
    })
    return images
  }, [project?.tasks])

  const createTask = (data: { title: string; description?: string; startDate: string; estimatedDays: number; deadline?: string }) => {
    const task: Task = {
      id: uuidv4(),
      title: data.title,
      description: data.description || 'Công việc mới cần cập nhật mô tả chi tiết.',
      status: 'todo',
      images: [],
      deadline: data.deadline || calculateDeadline(data.startDate, data.estimatedDays),
      estimatedDays: data.estimatedDays,
      startDate: data.startDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
      order: project.tasks.length + 1
    }
    addTask(project.id, task)
    showToast('Đã tạo hạng mục mới', 'success')
    if (project.webhookUrl) {
      sendWebhook(getProjectWithType({ ...project, tasks: [...project.tasks, task] }), task, 'task_created').catch(() => {
        showToast('Webhook gửi thất bại', 'error')
      })
    }
  }

  const updateWebhook = async () => {
    try {
      await updateProject(project.id, { webhookUrl })
      showToast('Cập nhật webhook thành công', 'success')
    } catch (error) {
      console.error('Error updating webhook:', error)
      showToast('Cập nhật webhook thất bại', 'error')
    }
  }

  const handleSendTestWebhook = async () => {
    if (!project) return
    setSendingTestWebhook(true)
    try {
      await sendTestWebhook(getProjectWithType(project))
      showToast('✅ Webhook test đã gửi thành công! Kiểm tra hệ thống nhận của bạn.', 'success')
    } catch (error) {
      console.error('Error sending test webhook:', error)
      showToast('❌ Gửi webhook test thất bại. Vui lòng kiểm tra URL webhook.', 'error')
    } finally {
      setSendingTestWebhook(false)
    }
  }

  const saveProjectChanges = async (updates: Partial<Project>) => {
    try {
      await updateProject(project.id, updates)
      showToast('Cập nhật dự án thành công', 'success')
    } catch (error) {
      console.error('Error updating project:', error)
      showToast('Cập nhật dự án thất bại', 'error')
      throw error
    }
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = project.tasks.find((item) => item.id === taskId)
    if (!task) return
    if (user.role === 'supervisor' && !['in_progress', 'done', 'adjustment', 'pending'].includes(newStatus)) {
      showToast('Giám sát chỉ có thể chuyển sang trạng thái hợp lệ', 'error')
      return
    }
    const previousStatus = task.status
    updateTask(project.id, taskId, {
      status: newStatus,
      note: `Chuyển trạng thái qua kéo thả`,
      updatedBy: user.name,
      updatedAt: new Date().toISOString()
    })
    showToast('Cập nhật trạng thái thành công', 'success')

    // Send Zalo notification for status change
    sendZaloNotification(project, 'task.status_changed', {
      taskTitle: task.title,
      oldStatus: previousStatus,
      newStatus: newStatus,
      updatedBy: user.name,
      timestamp: new Date().toISOString(),
    })

    sendWebhook(getProjectWithType({ ...project, tasks: project.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)) }), { ...task, status: newStatus } as Task, 'status_changed', task.status).catch(() => {
      showToast('Webhook gửi thất bại', 'error')
    })
  }

  return (
    <div className="space-y-6">
      <Header
        title={project.name}
        description={`Khách hàng: ${customer?.fullName || project.client} · ${project.address?.fullAddress || project.location}`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setShowEditProjectModal(true)}>
              ✏️ Chỉnh sửa
            </Button>
            <Button type="button" onClick={() => setShowCreateTaskModal(true)}>
              Thêm hạng mục
            </Button>
            <Button type="button" variant="secondary" onClick={() => exportProjectPdf(project, { customerName: customer?.fullName, customerPhone: customer?.phone })}>
              Xuất PDF
            </Button>
          </div>
        }
      />

      {/* Zalo Status Badge */}
      {project.zaloStatus === 'linked' && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">
            ✓ Zalo đã kết nối: <span className="font-semibold">"{project.zaloGroupName}"</span>
          </p>
        </div>
      )}
      {project.zaloStatus === 'failed' && (
        <div className="flex items-center justify-between rounded-3xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">🔴 Zalo chưa kết nối</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              // Retry creating Zalo group
              const customer = customers.find((c) => c.id === project.customerId)
              if (customer) {
                showToast('Đang thử lại...', 'info')
                createZaloGroupForProject(project, customer, user.name).then((result) => {
                  if (result.success) {
                    updateProject(project.id, {
                      zaloGroupThreadId: result.zaloGroupThreadId,
                      zaloGroupName: result.zaloGroupName,
                      zaloLinkedAt: new Date().toISOString(),
                      zaloStatus: 'linked' as const,
                    })
                    showToast(`✓ Đã tạo nhóm Zalo: "${result.zaloGroupName}"`, 'success')
                  } else {
                    showToast(`Không thể kết nối Zalo: ${result.error}`, 'error')
                  }
                })
              }
            }}
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="rounded-3xl bg-white shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 p-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Đầu việc
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
              activeTab === 'finance'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tài chính
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
              activeTab === 'images'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Hình ảnh
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Khách hàng</p>
                  {customer ? (
                    <button type="button" className="mt-2 text-sm font-semibold text-blue-600 underline" onClick={() => navigate(`/customers/${customer.id}`)}>
                      {customer.fullName}
                    </button>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-slate-900">{project.client}</p>
                  )}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Loại hình</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{project.category === 'new_construction' ? 'Xây mới' : project.category === 'renovation' ? 'Cải tạo' : 'Khác'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Giá trị HĐ</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN').format(project.contractValue)} đ</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Đã TT</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{Math.round((project.paidAmount / Math.max(1, project.contractValue)) * 100)}% ({new Intl.NumberFormat('vi-VN').format(project.paidAmount)} đ)</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Tiến độ dự án</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">{progress}%</h2>
              </div>
              <div className={`rounded-3xl px-4 py-3 text-sm font-semibold text-white ${deadlineDays <= 7 ? 'bg-rose-500' : 'bg-slate-700'}`}>
                {deadlineDays <= 7 ? 'Deadline gần' : `${deadlineDays} ngày còn lại`}
              </div>
            </div>
            <ProgressBar value={progress} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Bắt đầu</p>
                <p className="mt-2 text-slate-900">{formatDate(project.startDate)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Kết thúc</p>
                <p className="mt-2 text-slate-900">{formatDate(project.endDate)}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Ghi chú</p>
              <p className="mt-2 text-slate-900">{project.notes || 'Không có ghi chú'}</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <h2 className="text-xl font-semibold text-slate-900">Thống kê nhanh</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p>Số đầu việc: {project.tasks.length}</p>
                <p>Hoàn thành: {project.tasks.filter(t => t.status === 'done').length}</p>
                <p>Đang làm: {project.tasks.filter(t => t.status === 'in_progress').length}</p>
                <p>Chưa bắt đầu: {project.tasks.filter(t => t.status === 'todo').length}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Nhân sự được phân công</p>
              <div className="mt-3 space-y-2">
                {assignedPersonnel.length > 0 ? assignedPersonnel.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="mt-1">{member.role === 'manager' ? 'Quản lý' : 'Giám sát'}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">Chưa có nhân sự nào được phân công vào dự án này.</p>}
              </div>
            </div>

            {/* Webhook Settings */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">🔗 Webhook - Nhận thông báo cập nhật</p>
                  <p className="mt-1 text-xs text-slate-600">Khi các đầu việc thay đổi trạng thái, một yêu cầu POST JSON sẽ được gửi tới URL của bạn</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <input
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={webhookUrl || project.webhookUrl || ''}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={updateWebhook}
                    className="flex-1 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    💾 Lưu Webhook
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTestWebhook}
                    disabled={sendingTestWebhook}
                    className="flex-1 rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-slate-400"
                  >
                    {sendingTestWebhook ? '⏳ Đang gửi...' : '🧪 Gửi Webhook Test'}
                  </button>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">📋 Webhook Payload:</p>
                <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-xs text-slate-700">
{`{
  "event": "status_changed",
  "timestamp": "2026-04-21T...",
  "project": {
    "id": "...",
    "name": "...",
    "progress": 50
  },
  "task": {
    "id": "...",
    "title": "...",
    "previousStatus": "todo",
    "newStatus": "in_progress",
    "updatedBy": "...",
    "deadline": "2026-05-01",
    "daysRemaining": 10,
    "isOverdue": false
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Chế độ xem</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{viewMode === 'kanban' ? 'Bảng Kanban' : 'Timeline tiến độ'}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={viewMode === 'kanban' ? 'primary' : 'secondary'} onClick={() => setViewMode('kanban')}>
                  📋 Kanban
                </Button>
                <Button type="button" variant={viewMode === 'kanban' ? 'secondary' : 'primary'} onClick={() => setViewMode('timeline')}>
                  📅 Timeline
                </Button>
              </div>
            </div>
            {viewMode === 'kanban' ? (
              <KanbanBoard project={project} user={user} onOpenTask={setSelectedTask} onStatusChange={handleStatusChange} />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[900px] rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Tháng: {new Date(project.startDate).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}</span>
                    <span className="font-semibold">Timeline dự án</span>
                  </div>
                  <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                    <div className="grid grid-cols-[200px_repeat(31,40px)] gap-0 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <div className="py-2">Hạng mục</div>
                      {Array.from({ length: 31 }, (_, index) => (
                        <div key={index} className="flex h-8 items-center justify-center border-l border-slate-200">{index + 1}</div>
                      ))}
                    </div>
                    <div className="space-y-3 p-4">
                      {project.tasks.map((task) => {
                        const planStart = task.startDate ? new Date(task.startDate) : new Date(project.startDate)
                        const planLength = task.estimatedDays || 1
                        const planDay = Math.max(1, planStart.getDate())
                        const planEnd = new Date(planStart)
                        planEnd.setDate(planEnd.getDate() + planLength - 1)
                        const overdue = task.status !== 'done' && new Date(task.deadline) < new Date()
                        const actualLength = task.status === 'done' && task.actualDays ? task.actualDays : task.status === 'in_progress' && task.startDate ? Math.max(1, Math.ceil((new Date().getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0
                        const statusColor = task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-amber-400' : overdue ? 'bg-rose-500' : 'bg-slate-300'
                        return (
                          <div key={task.id} className="grid grid-cols-[200px_repeat(31,40px)] items-center gap-0 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                              <div className="mt-1 text-xs text-slate-500">{task.startDate || 'Chưa rõ'} → {task.deadline}</div>
                            </div>
                            {Array.from({ length: 31 }, (_, index) => {
                              const day = index + 1
                              const isPlanned = day >= planDay && day < planDay + planLength
                              const isActual = day >= planDay && day < planDay + actualLength
                              return (
                                <div key={day} className={`h-8 border-l border-slate-200 ${isPlanned ? 'bg-emerald-100' : ''} ${isActual ? statusColor : ''}`}></div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="p-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Giá trị hợp đồng</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.contractValue)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Đã thanh toán</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.paidAmount)}</p>
              <p className="mt-1 text-sm text-slate-600">{Math.round((project.paidAmount / Math.max(1, project.contractValue)) * 100)}% tổng giá trị</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Còn lại</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.contractValue - project.paidAmount)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Ghi chú thanh toán</p>
              <p className="mt-2 text-slate-900">{project.paymentNote || 'Không có ghi chú'}</p>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="p-6 space-y-4">
            {(!projectImages || projectImages.length === 0) ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-600">📸 Chưa có hình ảnh nào được tải lên</p>
                <p className="text-xs text-slate-500 mt-2">Tải hình ảnh từ từng công việc trong tab "Hình ảnh" của task</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">📁 Tổng cộng: {projectImages.length} hình ảnh</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projectImages.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition">
                      <div className="relative bg-slate-100 w-full h-48 overflow-hidden">
                        {item.imageData.startsWith('data:image/') ? (
                          <img src={item.imageData} alt={`${item.taskTitle}`} className="w-full h-full object-cover" />
                        ) : item.imageData.startsWith('data:video/') ? (
                          <video src={item.imageData} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <span className="text-slate-500">🎬 Video</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-slate-900 truncate" title={item.taskTitle}>
                          📋 {item.taskTitle}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          🕐 {item.uploadedAt ? formatDate(item.uploadedAt) : 'Không rõ thời gian'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTask ? (
        <TaskModal
          project={project}
          task={selectedTask}
          user={user}
          onClose={() => setSelectedTask(null)}
          onSave={saveTaskChanges}
          onUploadImages={uploadImages}
        />
      ) : null}
      {showEditProjectModal ? (
        <ProjectEditModal
          isOpen={showEditProjectModal}
          project={project}
          onClose={() => setShowEditProjectModal(false)}
          onSave={saveProjectChanges}
        />
      ) : null}
      {showConfirm ? (
        <ConfirmModal
          title="Xóa hạng mục"
          description="Tính năng này sẽ xóa hạng mục khỏi dự án. Bạn có chắc không?"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false)
            showToast('Hạng mục đã được xóa', 'success')
          }}
        />
      ) : null}
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onSubmit={createTask}
        activeTaskCount={activeTaskCount}
      />
    </div>
  )
}
