import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
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
  const [showConfirm, setShowConfirm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskWeight, setNewTaskWeight] = useState('10')
  const [webhookUrl, setWebhookUrl] = useState('')

  const project = useMemo(() => projects.find((item) => item.id === projectId) || null, [projects, projectId])

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

  const createTask = () => {
    if (!newTaskTitle || !newTaskWeight) {
      showToast('Vui lòng nhập tên và weight công việc', 'error')
      return
    }
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: 'Công việc mới cần cập nhật mô tả chi tiết.',
      status: 'todo',
      weight: Number(newTaskWeight),
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
      order: project.tasks.length + 1
    }
    addTask(project.id, task)
    showToast('Đã tạo hạng mục mới', 'success')
    setShowTaskForm(false)
    setNewTaskTitle('')
    setNewTaskWeight('10')
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
        description={`Dự án ${project.location} - Khách hàng ${project.client}`}
        actions={
          <Button type="button" onClick={() => setShowTaskForm((value) => !value)}>
            Thêm hạng mục
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
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
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
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
            <input className="rounded-3xl border border-slate-200 px-4 py-3" value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Tên hạng mục" />
            <input className="rounded-3xl border border-slate-200 px-4 py-3" type="number" min={1} max={100} value={newTaskWeight} onChange={(event) => setNewTaskWeight(event.target.value)} placeholder="Weight %" />
            <div className="flex items-center gap-3">
              <Button type="button" onClick={createTask}>Thêm</Button>
              <Button type="button" variant="secondary" onClick={() => setShowTaskForm(false)}>Hủy</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <KanbanBoard project={project} user={user} onOpenTask={setSelectedTask} onStatusChange={handleStatusChange} />
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
