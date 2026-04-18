import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../stores/useProjectStore'
import { useProjectTypeStore } from '../../stores/useProjectTypeStore'
import { useCustomerStore } from '../../stores/useCustomerStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { Project, Task, ProjectAddress } from '../../types'
import Button from '../ui/Button'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface ProjectCreateModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

interface FormData {
  projectName: string
  projectTypeId: string
  location: string
  customerId: string
  startDate: string
  endDate: string
  contractValue: string
  webhookUrl: string
  notes: string
}

export default function ProjectCreateModal({ isOpen, onClose, showToast }: ProjectCreateModalProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const addProject = useProjectStore((state) => state.addProject)
  const projectTypes = useProjectTypeStore((state) => state.projectTypes)
  const getDefaultTaskTemplates = useProjectTypeStore((state) => state.getDefaultTaskTemplates)
  const getTaskTemplatesByProjectType = useProjectTypeStore((state) => state.getTaskTemplatesByProjectType)
  const customers = useCustomerStore((state) => state.customers)

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    projectTypeId: '',
    location: '',
    customerId: '',
    startDate: '',
    endDate: '',
    contractValue: '',
    webhookUrl: '',
    notes: ''
  })

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [customTasks, setCustomTasks] = useState<string[]>([''])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedProjectType = useMemo(
    () => projectTypes.find((pt) => pt.id === formData.projectTypeId),
    [projectTypes, formData.projectTypeId]
  )

  const availableTemplates = useMemo(
    () => (formData.projectTypeId ? getTaskTemplatesByProjectType(formData.projectTypeId) : []),
    [formData.projectTypeId, getTaskTemplatesByProjectType]
  )

  const defaultTemplateIds = useMemo(
    () =>
      formData.projectTypeId
        ? getDefaultTaskTemplates(formData.projectTypeId).map((t) => t.id)
        : [],
    [formData.projectTypeId, getDefaultTaskTemplates]
  )

  // Initialize selected templates with defaults when project type changes
  useEffect(() => {
    if (formData.projectTypeId) {
      setSelectedTemplates(defaultTemplateIds)
    }
  }, [formData.projectTypeId, defaultTemplateIds])

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.projectName.trim()) newErrors.projectName = 'Tên dự án không được để trống'
    if (!formData.projectTypeId) newErrors.projectTypeId = 'Vui lòng chọn loại dự án'
    if (!formData.customerId) newErrors.customerId = 'Vui lòng chọn khách hàng'
    if (!formData.startDate) newErrors.startDate = 'Ngày bắt đầu không được để trống'
    if (!formData.endDate) newErrors.endDate = 'Ngày hoàn thành không được để trống'

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'Ngày hoàn thành phải sau ngày bắt đầu'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleCreateProject = () => {
    if (!user) return

    try {
      // Create the project
      const newProject: Project = {
        id: `proj_${Date.now()}`,
        name: formData.projectName,
        location: formData.location,
        client: customers.find((c) => c.id === formData.customerId)?.fullName || '',
        customerId: formData.customerId,
        category: 'new_construction',
        address: {
          fullAddress: formData.location
        },
        contractValue: parseInt(formData.contractValue) || 0,
        paidAmount: 0,
        attachments: [],
        startDate: formData.startDate,
        endDate: formData.endDate,
        webhookUrl: formData.webhookUrl,
        assignedStaff: [],
        projectTypeId: formData.projectTypeId,
        notes: formData.notes,
        tasks: [],
        createdAt: new Date().toISOString()
      }

      // Create tasks from selected templates
      const tasksToCreate: Task[] = []

      // Add tasks from templates
      availableTemplates.forEach((template) => {
        if (selectedTemplates.includes(template.id)) {
          tasksToCreate.push({
            id: `task_${Date.now()}_${Math.random()}`,
            title: template.title,
            description: '',
            status: 'todo',
            images: [],
            deadline: formData.endDate,
            estimatedDays: null,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedBy: user.id,
            order: tasksToCreate.length,
            fromTemplateId: template.id,
            note: ''
          })
        }
      })

      // Add custom tasks
      customTasks.forEach((customTask) => {
        if (customTask.trim()) {
          tasksToCreate.push({
            id: `task_${Date.now()}_${Math.random()}`,
            title: customTask.trim(),
            description: '',
            status: 'todo',
            images: [],
            deadline: formData.endDate,
            estimatedDays: null,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedBy: user.id,
            order: tasksToCreate.length,
            fromTemplateId: null,
            note: ''
          })
        }
      })

      newProject.tasks = tasksToCreate

      // Save the project
      addProject(newProject)

      showToast('Dự án đã được tạo thành công', 'success')
      onClose()

      // Redirect to project detail
      navigate(`/projects/${newProject.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      showToast('Có lỗi khi tạo dự án', 'error')
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={handleBackdropClick}
    >
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white sm:rounded-3xl sm:max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            {step === 1 ? 'Tạo dự án mới' : `Đầu việc cho dự án "${selectedProjectType?.name}"`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-4 border-b border-slate-200 px-6 py-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 1 ? 'bg-brand-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
            1
          </div>
          <div className="h-1 w-8 bg-slate-200" />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 2 ? 'bg-brand-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
            2
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 1 ? (
            // Step 1: Project Info
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  Tên dự án <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${
                    errors.projectName ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500'
                  }`}
                  placeholder="Nhập tên dự án"
                />
                {errors.projectName && <p className="mt-1 text-sm text-rose-600">{errors.projectName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  Loại dự án <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.projectTypeId}
                  onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${
                    errors.projectTypeId ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500'
                  }`}
                >
                  <option value="">-- Chọn loại dự án --</option>
                  {projectTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.projectTypeId && <p className="mt-1 text-sm text-rose-600">{errors.projectTypeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">Địa điểm</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition hover:border-slate-300 focus:border-brand-500"
                  placeholder="Nhập địa điểm dự án"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  Khách hàng <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${
                    errors.customerId ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500'
                  }`}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName}
                    </option>
                  ))}
                </select>
                {errors.customerId && <p className="mt-1 text-sm text-rose-600">{errors.customerId}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    Ngày bắt đầu <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${
                      errors.startDate ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500'
                    }`}
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-rose-600">{errors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    Ngày hoàn thành dự kiến <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${
                      errors.endDate ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500'
                    }`}
                  />
                  {errors.endDate && <p className="mt-1 text-sm text-rose-600">{errors.endDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">Giá trị hợp đồng (VND)</label>
                <input
                  type="number"
                  value={formData.contractValue}
                  onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition hover:border-slate-300 focus:border-brand-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition hover:border-slate-300 focus:border-brand-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900">Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition hover:border-slate-300 focus:border-brand-500"
                  placeholder="Ghi chú thêm..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            // Step 2: Task Templates
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Chọn đầu việc mẫu</h3>
                <div className="space-y-3">
                  {availableTemplates.map((template) => (
                    <label key={template.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.includes(template.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTemplates([...selectedTemplates, template.id])
                          } else {
                            setSelectedTemplates(selectedTemplates.filter((id) => id !== template.id))
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="flex-1 text-slate-900">{template.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Thêm đầu việc tự định</h3>
                <div className="space-y-3">
                  {customTasks.map((task, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => {
                          const newCustomTasks = [...customTasks]
                          newCustomTasks[index] = e.target.value
                          setCustomTasks(newCustomTasks)
                        }}
                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none transition hover:border-slate-300 focus:border-brand-500"
                        placeholder="Nhập tên đầu việc"
                      />
                      {index === customTasks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setCustomTasks([...customTasks, ''])}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-600 hover:bg-slate-100"
                        >
                          + Thêm
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ChevronLeft size={18} /> Quay lại
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
          )}
          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center justify-center gap-2 flex-1 rounded-2xl bg-brand-900 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Tiếp theo <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateProject}
              className="flex-1 rounded-2xl bg-brand-900 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Tạo dự án
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
