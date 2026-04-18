import { useState, useCallback, useEffect } from 'react'
import { useProjectTypeStore } from '../stores/useProjectTypeStore'
import { ProjectType, TaskTemplate } from '../types'
import Button from '../components/ui/Button'
import { Plus, Trash2, Star, Edit2, GripVertical } from 'lucide-react'
import { CSS } from '@dnd-kit/utilities'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import ConfirmModal from '../components/modals/ConfirmModal'

interface SettingsProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

interface SortableTaskTemplateProps {
  template: TaskTemplate
  projectTypeId: string
  onToggleDefault: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, title: string) => void
}

function SortableTaskTemplate({ template, projectTypeId, onToggleDefault, onDelete, onUpdate }: SortableTaskTemplateProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: template.id })
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(template.title)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleSave = () => {
    if (editedTitle.trim()) {
      onUpdate(template.id, editedTitle.trim())
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
        <GripVertical size={18} />
      </div>

      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            Lưu
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setEditedTitle(template.title)
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            Hủy
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <span className="text-slate-900">{template.title}</span>
        </div>
      )}

      {!isEditing && (
        <div className="flex gap-2">
          <button
            onClick={() => onToggleDefault(template.id)}
            className={`p-2 rounded-lg transition ${
              template.isDefault ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:text-amber-600'
            }`}
            title={template.isDefault ? 'Bỏ đánh dấu mặc định' : 'Đánh dấu mặc định'}
          >
            <Star size={16} fill={template.isDefault ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:text-rose-700 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function Settings({ showToast }: SettingsProps) {
  const projectTypes = useProjectTypeStore((state) => state.projectTypes)
  const updateProjectType = useProjectTypeStore((state) => state.updateProjectType)
  const addProjectType = useProjectTypeStore((state) => state.addProjectType)
  const deleteProjectType = useProjectTypeStore((state) => state.deleteProjectType)
  const taskTemplates = useProjectTypeStore((state) => state.taskTemplates)
  const addTaskTemplate = useProjectTypeStore((state) => state.addTaskTemplate)
  const updateTaskTemplate = useProjectTypeStore((state) => state.updateTaskTemplate)
  const deleteTaskTemplate = useProjectTypeStore((state) => state.deleteTaskTemplate)

  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState<string | null>(projectTypes[0]?.id || null)
  const [editingProjectTypeId, setEditingProjectTypeId] = useState<string | null>(null)
  const [editingProjectTypeName, setEditingProjectTypeName] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'project' | 'task'; id: string } | null>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const selectedProjectType = projectTypes.find((pt) => pt.id === selectedProjectTypeId)
  const selectedTypeTaskTemplates = selectedProjectType
    ? taskTemplates.filter((tt) => tt.projectTypeId === selectedProjectType.id).sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleAddProjectType = () => {
    addProjectType({
      name: 'Loại dự án mới',
      color: '#3B82F6',
      isActive: true
    })
    showToast('Loại dự án đã được thêm', 'success')
  }

  const handleUpdateProjectTypeName = (id: string, newName: string) => {
    if (newName.trim()) {
      updateProjectType(id, { name: newName.trim() })
      setEditingProjectTypeId(null)
    }
  }

  const handleDeleteProjectType = (id: string) => {
    const projectsUsingType = 0 // TODO: Check if any projects use this type
    setShowDeleteConfirm({ type: 'project', id })
  }

  const handleConfirmDeleteProjectType = (id: string) => {
    deleteProjectType(id)
    if (selectedProjectTypeId === id) {
      setSelectedProjectTypeId(projectTypes[0]?.id || null)
    }
    setShowDeleteConfirm(null)
    showToast('Loại dự án đã được xóa', 'success')
  }

  const handleAddTaskTemplate = () => {
    if (!selectedProjectType || !newTaskTitle.trim()) return

    addTaskTemplate({
      projectTypeId: selectedProjectType.id,
      title: newTaskTitle.trim(),
      sortOrder: selectedTypeTaskTemplates.length + 1,
      isDefault: false
    })

    setNewTaskTitle('')
    showToast('Đầu việc đã được thêm', 'success')
  }

  const handleToggleDefault = (templateId: string) => {
    const template = taskTemplates.find((tt) => tt.id === templateId)
    if (template) {
      updateTaskTemplate(templateId, { isDefault: !template.isDefault })
    }
  }

  const handleDeleteTaskTemplate = (templateId: string) => {
    setShowDeleteConfirm({ type: 'task', id: templateId })
  }

  const handleConfirmDeleteTaskTemplate = (templateId: string) => {
    deleteTaskTemplate(templateId)
    setShowDeleteConfirm(null)
    showToast('Đầu việc đã được xóa', 'success')
  }

  const handleUpdateTaskTemplate = (templateId: string, newTitle: string) => {
    updateTaskTemplate(templateId, { title: newTitle })
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedTypeTaskTemplates.findIndex((t) => t.id === active.id)
      const newIndex = selectedTypeTaskTemplates.findIndex((t) => t.id === over.id)

      const reorderedTemplates = arrayMove(selectedTypeTaskTemplates, oldIndex, newIndex)

      // Update sortOrder for all templates
      reorderedTemplates.forEach((template, index) => {
        updateTaskTemplate(template.id, { sortOrder: index + 1 })
      })

      showToast('Thứ tự đã được cập nhật', 'success')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Cấu hình</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Cài đặt dự án</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Project Types */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Loại dự án</h2>
            <Button type="button" onClick={handleAddProjectType}>
              <Plus size={16} className="mr-2" /> Thêm
            </Button>
          </div>

          <div className="space-y-2">
            {projectTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => setSelectedProjectTypeId(type.id)}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer transition ${
                  selectedProjectTypeId === type.id
                    ? 'bg-brand-50 border border-brand-200'
                    : 'border border-transparent hover:bg-slate-50'
                }`}
              >
                <div>
                  {editingProjectTypeId === type.id ? (
                    <input
                      type="text"
                      value={editingProjectTypeName}
                      onChange={(e) => setEditingProjectTypeName(e.target.value)}
                      className="rounded-lg border border-brand-500 px-3 py-1 outline-none"
                      autoFocus
                      onBlur={() => {
                        handleUpdateProjectTypeName(type.id, editingProjectTypeName)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateProjectTypeName(type.id, editingProjectTypeName)
                        } else if (e.key === 'Escape') {
                          setEditingProjectTypeId(null)
                        }
                      }}
                    />
                  ) : (
                    <div>
                      <span className="font-medium text-slate-900">{type.name}</span>
                      <span className="ml-2 text-xs text-slate-500">({selectedTypeTaskTemplates.length} đầu việc)</span>
                    </div>
                  )}
                </div>

                {editingProjectTypeId !== type.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProjectTypeId(type.id)
                        setEditingProjectTypeName(type.name)
                      }}
                      className="p-2 text-slate-600 hover:text-slate-900"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProjectType(type.id)
                      }}
                      className="p-2 text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Task Templates */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            Đầu việc mẫu {selectedProjectType ? `— ${selectedProjectType.name}` : ''}
          </h2>

          {selectedProjectType ? (
            <div className="space-y-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={selectedTypeTaskTemplates.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 mb-6">
                    {selectedTypeTaskTemplates.map((template) => (
                      <SortableTaskTemplate
                        key={template.id}
                        template={template}
                        projectTypeId={selectedProjectType.id}
                        onToggleDefault={handleToggleDefault}
                        onDelete={handleDeleteTaskTemplate}
                        onUpdate={handleUpdateTaskTemplate}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTaskTemplate()
                    }
                  }}
                  placeholder="Tên đầu việc mới"
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                />
                <button
                  onClick={handleAddTaskTemplate}
                  className="rounded-2xl bg-brand-900 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Chọn một loại dự án để xem đầu việc mẫu</p>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Xác nhận xóa"
          description={
            showDeleteConfirm.type === 'project'
              ? 'Bạn có chắc muốn xóa loại dự án này? Hành động này không thể hoàn tác.'
              : 'Bạn có chắc muốn xóa đầu việc này?'
          }
          onCancel={() => setShowDeleteConfirm(null)}
          onConfirm={() => {
            if (showDeleteConfirm.type === 'project') {
              handleConfirmDeleteProjectType(showDeleteConfirm.id)
            } else {
              handleConfirmDeleteTaskTemplate(showDeleteConfirm.id)
            }
          }}
        />
      )}
    </div>
  )
}
