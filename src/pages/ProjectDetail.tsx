import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useCustomerStore } from '../stores/useCustomerStore'
import { useProjectStore } from '../stores/useProjectStore'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import TaskModal from '../components/modals/TaskModal'
import ConfirmModal from '../components/modals/ConfirmModal'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { calculateProjectProgress, formatDate, daysUntil } from '../utils/progress'
import { sendWebhook } from '../utils/webhook'
import { exportProjectPdf } from '../utils/pdfReport'
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
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [newTaskEstimatedDays, setNewTaskEstimatedDays] = useState('7')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')

  const customers = useCustomerStore((state) => state.customers)
  const project = useMemo(() => projects.find((item) => item.id === projectId) || null, [projects, projectId])
  const customer = useMemo(() => project ? customers.find((item) => item.id === project.customerId) || null : null, [customers, project])

  const calculateDeadline = (startDate: string, estimatedDays: number) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + estimatedDays)
    return date.toISOString().slice(0, 10)
  }

  useEffect(() => {
    if (newTaskStartDate && newTaskEstimatedDays) {
      setNewTaskDeadline(calculateDeadline(newTaskStartDate, Number(newTaskEstimatedDays)))
    }
  }, [newTaskStartDate, newTaskEstimatedDays])

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
      sendWebhook(updatedProject, { ...selectedTask, ...updatedTask } as Task, 'status_changed', previousStatus).catch(() => {
        showToast('Webhook gửi thất bại', 'error')
      })
    }
  }

  const uploadImages = async (files: FileList) => {
    const imagePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Không thể đọc ảnh'))
        reader.readAsDataURL(file)
      })
    })

    try {
      const images = await Promise.all(imagePromises)
      if (!selectedTask) return
      const nextImages = [...selectedTask.images, ...images]
      updateTask(project.id, selectedTask.id, { images: nextImages })
      showToast('Upload ảnh thành công', 'success')
      const updatedProject = useProjectStore.getState().projects.find((item) => item.id === project.id)
      if (updatedProject) {
        sendWebhook(updatedProject, { ...selectedTask, images: nextImages } as Task, 'image_uploaded').catch(() => {
          showToast('Webhook gửi thất bại', 'error')
        })
      }
    } catch {
      showToast('Upload ảnh thất bại', 'error')
    }
  }

  const activeTaskCount = useMemo(() => project.tasks.filter((task) => task.status !== 'cancelled').length, [project.tasks])
  const nextWeight = activeTaskCount > 0 ? Math.round(100 / (activeTaskCount + 1)) : 0

  const createTask = () => {
    if (!newTaskTitle || !newTaskStartDate || !newTaskEstimatedDays) {
      showToast('Vui lòng nhập tên, ngày bắt đầu và số ngày thi công', 'error')
      return
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: 'Công việc mới cần cập nhật mô tả chi tiết.',
      status: 'todo',
      images: [],
      deadline: newTaskDeadline || calculateDeadline(newTaskStartDate, Number(newTaskEstimatedDays)),
      estimatedDays: Number(newTaskEstimatedDays),
      startDate: newTaskStartDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
      order: project.tasks.length + 1
    }
    addTask(project.id, task)
    showToast('Đã tạo hạng mục mới', 'success')
    setShowTaskForm(false)
    setNewTaskTitle('')
    setNewTaskEstimatedDays('7')
    setNewTaskDeadline(calculateDeadline(newTaskStartDate, Number(newTaskEstimatedDays)))
    if (project.webhookUrl) {
      sendWebhook({ ...project, tasks: [...project.tasks, task] }, task, 'task_created').catch(() => {
        showToast('Webhook gửi thất bại', 'error')
      })
    }
  }

  const updateWebhook = () => {
    updateProject(project.id, { webhookUrl })
    showToast('Cập nhật webhook thành công', 'success')
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = project.tasks.find((item) => item.id === taskId)
    if (!task) return
    if (user.role === 'supervisor' && !['in_progress', 'done', 'adjustment', 'pending'].includes(newStatus)) {
      showToast('Giám sát chỉ có thể chuyển sang trạng thái hợp lệ', 'error')
      return
    }
    updateTask(project.id, taskId, {
      status: newStatus,
      note: `Chuyển trạng thái qua kéo thả`,
      updatedBy: user.name,
      updatedAt: new Date().toISOString()
    })
    showToast('Cập nhật trạng thái thành công', 'success')
    sendWebhook({ ...project, tasks: project.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)) }, { ...task, status: newStatus } as Task, 'status_changed', task.status).catch(() => {
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
            <Button type="button" onClick={() => setShowTaskForm((value) => !value)}>
              Thêm hạng mục
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAttachments((value) => !value)}>
              📎 Tài liệu
            </Button>
            <Button type="button" variant="secondary" onClick={() => exportProjectPdf(project, { customerName: customer?.fullName, customerPhone: customer?.phone })}>
              Xuất PDF
            </Button>
          </div>
        }
      />
      {showAttachments ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Tài liệu dự án</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Đính kèm</h2>
            </div>
            <Button type="button" variant="secondary" onClick={() => setShowAttachments(false)}>
              Đóng
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {(!project.attachments || project.attachments.length === 0) ? (
              <p className="text-sm text-slate-600">Chưa có file đính kèm.</p>
            ) : (
              project.attachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{file.type.toUpperCase()} · {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-900">Xem</a>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Khách hàng</p>
                {customer ? (
                  <button type="button" className="mt-2 text-sm font-semibold text-brand-900 underline" onClick={() => navigate(`/customers/${customer.id}`)}>
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
            <p className="text-sm text-slate-500">Webhook URL</p>
            <input
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={webhookUrl || project.webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="Dán webhook URL tại đây"
            />
            <Button type="button" variant="secondary" className="mt-4" onClick={updateWebhook}>
              Cập nhật Webhook
            </Button>
          </div>
          <div className="rounded-3xl bg-white p-4">
            <h2 className="text-xl font-semibold text-slate-900">Thông tin nhanh</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p>Chủ đầu tư: {project.client}</p>
              <p>Địa điểm: {project.location}</p>
              <p>Số hạng mục: {project.tasks.length}</p>
              <p>Trạng thái: {progress === 100 ? 'Hoàn thành' : 'Đang thi công'}</p>
            </div>
          </div>
        </div>

      {showTaskForm && user.role === 'manager' ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Tạo hạng mục mới</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Tên hạng mục</label>
              <input
                className="w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Tên hạng mục"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Ngày bắt đầu dự kiến</label>
              <input
                type="date"
                className="w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={newTaskStartDate}
                onChange={(event) => setNewTaskStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Số ngày thi công</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={newTaskEstimatedDays}
                onChange={(event) => setNewTaskEstimatedDays(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <label className="block text-sm font-semibold text-slate-700">Deadline</label>
              <input
                type="date"
                className="w-full rounded-3xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900"
                value={newTaskDeadline}
                onChange={(event) => setNewTaskDeadline(event.target.value)}
              />
              <p className="text-xs text-slate-500">Deadline tự động tính từ ngày bắt đầu + số ngày, có thể ghi đè.</p>
            </div>
          </div>
          <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
            Thêm hạng mục này, mỗi hạng mục đóng góp 1/{activeTaskCount + 1} = {nextWeight}%
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={createTask}>Thêm</Button>
            <Button type="button" variant="secondary" onClick={() => setShowTaskForm(false)}>Hủy</Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
    </div>
  )
}
