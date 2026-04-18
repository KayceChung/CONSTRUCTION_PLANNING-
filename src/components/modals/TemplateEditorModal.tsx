import { useMemo, useState } from 'react'
import Button from '../ui/Button'
import { TaskTemplate } from '../../types'

interface TemplateEditorModalProps {
  isOpen: boolean
  onClose: () => void
  projectTypeName: string
  templates: TaskTemplate[]
  onAdd: (title: string) => void
  onUpdate: (id: string, title: string) => void
  onDelete: (id: string) => void
}

export default function TemplateEditorModal({
  isOpen,
  onClose,
  projectTypeName,
  templates,
  onAdd,
  onUpdate,
  onDelete
}: TemplateEditorModalProps) {
  const [newTitle, setNewTitle] = useState('')

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.sortOrder - b.sortOrder),
    [templates]
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Thiết kế mẫu task</h2>
            <p className="mt-1 text-sm text-slate-500">Loại dự án: {projectTypeName}</p>
          </div>
          <button className="text-slate-500 hover:text-slate-900" type="button" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Thêm task mới</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Tên task mẫu"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
              />
              <Button type="button" onClick={() => {
                if (!newTitle.trim()) return
                onAdd(newTitle.trim())
                setNewTitle('')
              }}>
                Thêm task
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Danh sách task mẫu</p>
              <p className="text-xs text-slate-500">Kéo vào mỗi nội dung hoặc xóa nếu không cần</p>
            </div>
            {sortedTemplates.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Chưa có task mẫu cho loại dự án này.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTemplates.map((template) => (
                  <div key={template.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <input
                        className="w-full rounded-3xl border border-slate-200 px-4 py-3"
                        value={template.title}
                        onChange={(event) => onUpdate(template.id, event.target.value)}
                      />
                      <p className="mt-2 text-xs text-slate-500">ID mẫu: {template.id}</p>
                    </div>
                    <Button type="button" variant="danger" onClick={() => onDelete(template.id)}>
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
