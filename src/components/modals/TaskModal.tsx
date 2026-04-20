import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import CameraCapture from './CameraCapture'
import { Project, Task, TaskStatus, User } from '../../types'
import { formatDate } from '../../utils/progress'

const schema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'adjustment', 'pending', 'cancelled']),
  description: z.string().optional(),
  note: z.string().optional()
})

interface TaskModalProps {
  project: Project
  task: Task
  user: User
  onClose: () => void
  onSave: (changes: Partial<Task>) => void
  onUploadImages: (files: FileList) => void
}

function clampNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function calculateDeadline(startDate: string, estimatedDays: number): string {
  const date = new Date(startDate)
  date.setDate(date.getDate() + estimatedDays)
  return date.toISOString().slice(0, 10)
}

function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return clampNumber(diff)
}

function isVideoUrl(src: string) {
  const lower = src.toLowerCase()
  return lower.startsWith('data:video/') || lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg')
}

export default function TaskModal({ project, task, user, onClose, onSave, onUploadImages }: TaskModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [startDate, setStartDate] = useState(task.startDate || '')
  const [estimatedDays, setEstimatedDays] = useState<string>(task.estimatedDays?.toString() || '')
  const [deadline, setDeadline] = useState(task.deadline)
  const [completedAt, setCompletedAt] = useState(task.completedAt || '')
  const [cameraMode, setCameraMode] = useState<'photo' | 'video' | null>(null)

  const { register, handleSubmit, watch } = useForm<z.infer<typeof schema>>({
    defaultValues: { status: task.status, description: task.description, note: task.note || '' },
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    register('status')
    register('description')
    register('note')
  }, [register])

  const status = watch('status')
  const noteRequired = useMemo(() => ['adjustment', 'pending', 'cancelled'].includes(status), [status])

  const handleFiles = (files: FileList | null) => {
    if (files) {
      setSelectedFiles(files)
    }
  }

  const handleCameraCapture = (file: File) => {
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    setSelectedFiles(dataTransfer.files)
    setCameraMode(null)
  }

  useEffect(() => {
    const days = Number(estimatedDays)
    if (startDate && days > 0) {
      setDeadline(calculateDeadline(startDate, days))
    }
  }, [startDate, estimatedDays])

  const handleOverrideDeadline = (value: string) => {
    setDeadline(value)
    if (startDate && value) {
      const days = calculateDaysBetween(startDate, value)
      setEstimatedDays(days > 0 ? String(days) : '')
    } else {
      setEstimatedDays('')
    }
  }

  const submit = handleSubmit((values) => {
    if (noteRequired && !values.note?.trim()) return

    let nextStartDate = startDate || task.startDate
    if (values.status === 'in_progress' && !nextStartDate) {
      nextStartDate = new Date().toISOString().slice(0, 10)
    }

    let nextCompletedAt = task.completedAt
    if (values.status === 'done') {
      nextCompletedAt = task.completedAt || new Date().toISOString().slice(0, 10)
      setCompletedAt(nextCompletedAt)
    }

    const nextActualDays = nextStartDate && nextCompletedAt ? calculateDaysBetween(nextStartDate, nextCompletedAt) : undefined

    onSave({
      status: values.status,
      description: values.description,
      note: values.note,
      updatedBy: user.name,
      images: task.images,
      startDate: nextStartDate,
      estimatedDays: estimatedDays ? Number(estimatedDays) : null,
      deadline,
      completedAt: nextCompletedAt,
      actualDays: values.status === 'done' ? nextActualDays : task.actualDays
    })

    if (selectedFiles) {
      onUploadImages(selectedFiles)
    }
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{project.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Đóng
          </button>
        </div>

        {/* Main Content - Two columns */}
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Description */}
            <div className="rounded-3xl bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-700">Mô tả</label>
              <textarea
                rows={3}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                {...register('description')}
                defaultValue={task.description || ''}
              />
            </div>

            {/* Timeline */}
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Thời gian thi công</p>
              <div className="mt-4 space-y-3">
                <label className="block text-sm text-slate-700">Ngày bắt đầu dự kiến</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />

                <label className="block text-sm text-slate-700">Số ngày thi công</label>
                <input
                  type="number"
                  min={1}
                  value={estimatedDays}
                  onChange={(event) => setEstimatedDays(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />

                <label className="block text-sm text-slate-700">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => handleOverrideDeadline(event.target.value)}
                  className="w-full rounded-3xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                />
                <p className="text-xs text-slate-500">Deadline tự động cập nhật từ ngày bắt đầu + số ngày. Bạn có thể ghi đè thủ công.</p>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Trạng thái hiện tại</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge label={task.status.replace('_', ' ')} type={task.status} />
                <span className="text-xs text-slate-500">Cập nhật: {formatDate(task.updatedAt)}</span>
              </div>
            </div>

            {/* Images */}
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Ảnh / Video thực tế</p>
              {task.images.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {task.images.slice(0, 6).map((src, index) => (
                    <div key={index} className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
                      {isVideoUrl(src) ? (
                        <video controls className="h-24 w-full object-cover">
                          <source src={src} />
                        </video>
                      ) : (
                        <img src={src} alt={`Media ${index + 1}`} className="h-24 w-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có ảnh hoặc video.</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Status Buttons */}
            <div className="rounded-3xl bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-700">Chuyển trạng thái</label>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { value: 'todo', label: 'Chưa bắt đầu', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                  { value: 'in_progress', label: 'Đang thi công', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                  { value: 'done', label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                  { value: 'adjustment', label: 'Điều chỉnh', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                  { value: 'pending', label: 'Tạm dừng', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                  { value: 'cancelled', label: 'Hủy bỏ', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' }
                ].map((statusOption) => (
                  <button
                    key={statusOption.value}
                    type="button"
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition ${statusOption.color} ${status === statusOption.value ? 'ring-2 ring-brand-500 ring-offset-1' : ''}`}
                    onClick={() => {
                      const event = { target: { name: 'status', value: statusOption.value } }
                      register('status').onChange(event)
                    }}
                  >
                    {statusOption.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Ghi chú bắt buộc khi chuyển về điều chỉnh, tạm dừng hoặc hủy bỏ.</p>
            </div>

            {/* Notes */}
            <div className="rounded-3xl bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-700">Ghi chú</label>
              <textarea
                rows={4}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                {...register('note')}
                defaultValue={task.note || ''}
              />
              {noteRequired && !watch('note') && <p className="mt-2 text-xs text-rose-500">Ghi chú là bắt buộc.</p>}
            </div>

            {/* Camera / Upload */}
            <div className="rounded-3xl bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Tải ảnh / Video</label>

              <div className="space-y-2">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                  <span className="block w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 rounded-lg text-center cursor-pointer transition text-sm">
                    📁 Chọn từ thư viện
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setCameraMode('photo')}
                  className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-2 rounded-lg transition text-sm"
                >
                  📸 Chụp ảnh
                </button>

                <button
                  type="button"
                  onClick={() => setCameraMode('video')}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg transition text-sm"
                >
                  🎥 Quay video
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-500">💡 Chọn từ thư viện, chụp ảnh hoặc quay video trực tiếp từ thiết bị của bạn.</p>
            </div>ns */}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="ghost" className="border border-slate-200 text-slate-700" onClick={onClose}>
                Hủy
              </Button>
              <Button type="button" onClick={submit}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {cameraMode && (
        <CameraCapture
          mode={cameraMode}
          onCapture={handleCameraCapture}
          onClose={() => setCameraMode(null)}
        />
      )}
    </div>
  )
}
