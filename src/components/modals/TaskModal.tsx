import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Project, Task, TaskStatus, User } from '../../types'
import { formatDate } from '../../utils/progress'
import { Image } from 'lucide-react'

const schema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'adjustment', 'pending', 'cancelled']),
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

export default function TaskModal({ project, task, user, onClose, onSave, onUploadImages }: TaskModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const { register, handleSubmit, watch, formState } = useForm<z.infer<typeof schema>>({
    defaultValues: { status: task.status, note: task.note || '' },
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    register('status')
    register('note')
  }, [register])

  const status = watch('status')
  const noteRequired = useMemo(() => ['adjustment', 'pending', 'cancelled'].includes(status), [status])

  const handleFiles = (files: FileList | null) => {
    if (files) {
      setSelectedFiles(files)
    }
  }

  const submit = handleSubmit((values) => {
    if (noteRequired && !values.note?.trim()) return
    onSave({
      status: values.status,
      note: values.note,
      updatedBy: user.name,
      images: task.images,
      completedAt: values.status === 'done' ? new Date().toISOString() : task.completedAt
    })
    if (selectedFiles) {
      onUploadImages(selectedFiles)
    }
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{project.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Đóng
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Mô tả</p>
              <p className="mt-2 text-slate-600">{task.description}</p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Trạng thái hiện tại</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge label={task.status.replace('_', ' ')} type={task.status} />
                <span className="text-xs text-slate-500">Cập nhật: {formatDate(task.updatedAt)}</span>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Ảnh thực tế</p>
              {task.images.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {task.images.slice(0, 6).map((src, index) => (
                    <img key={index} src={src} alt={`Ảnh ${index + 1}`} className="h-24 w-full rounded-2xl object-cover" />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có ảnh.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-700">Chuyển trạng thái</label>
              <select
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm"
                {...register('status')}
                defaultValue={task.status}
              >
                <option value="todo">Chưa bắt đầu</option>
                <option value="in_progress">Đang thi công</option>
                <option value="done">Hoàn thành</option>
                <option value="adjustment">Điều chỉnh</option>
                <option value="pending">Tạm dừng</option>
                <option value="cancelled">Hủy bỏ</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">Ghi chú bắt buộc khi chuyển về điều chỉnh, tạm dừng hoặc hủy bỏ.</p>
            </div>

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

            {user.role === 'supervisor' && ['in_progress', 'done'].includes(task.status) ? (
              <div className="rounded-3xl bg-slate-50 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Image size={16} /> Upload ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-3 text-sm text-slate-600"
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </div>
            ) : null}

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
    </div>
  )
}
