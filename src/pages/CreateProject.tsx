import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useAuthStore } from '../stores/useAuthStore'
import { useCustomerStore } from '../stores/useCustomerStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useProjectTypeStore } from '../stores/useProjectTypeStore'
import { useStaffStore } from '../stores/useStaffStore'
import { provinces } from '../constants/provinces'
import { Attachment, Customer, Project, Task, TaskStatus } from '../types'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import NewCustomerModal from '../components/modals/NewCustomerModal'
import TemplateEditorModal from '../components/modals/TemplateEditorModal'
import { formatDate } from '../utils/progress'

interface LocationState {
  customerId?: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatContractValueLabel(value: number) {
  if (value >= 1e9) return `≈ ${Math.round(value / 1e8) / 10} tỷ đồng`
  if (value >= 1e6) return `≈ ${Math.round(value / 1e5) / 10} triệu đồng`
  return `${formatCurrency(value)} đ`
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Có lỗi khi lưu dữ liệu lên Supabase'
}

const stepTitles = ['Khách hàng', 'Dự án', 'Tài chính', 'Xác nhận']

function inferCategoryFromProjectTypeName(projectTypeName: string): 'new_construction' | 'renovation' | 'other' {
  const normalizedName = projectTypeName.toLowerCase()
  if (normalizedName.includes('cải tạo') || normalizedName.includes('sua chua') || normalizedName.includes('renov')) {
    return 'renovation'
  }
  if (normalizedName.includes('xây') || normalizedName.includes('xay') || normalizedName.includes('new')) {
    return 'new_construction'
  }
  return 'other'
}

interface DraftData {
  step: number
  selectedCustomerId: string
  selectedProjectTypeId: string
  projectName: string
  projectFullAddress: string
  projectWard: string
  projectDistrict: string
  projectProvince: string
  projectMapsUrl: string
  distanceKm: string
  projectStart: string
  projectEnd: string
  estimatedDurationDays: string
  selectedSupervisors: string[]
  webhookUrl: string
  selectedClientId: string
  category: 'new_construction' | 'renovation' | 'other'
  categoryNote: string
  contractValue: string
  paidAmount: string
  paymentNote: string
  attachments: Attachment[]
}

const DRAFT_KEY = 'project-creation-draft'
const MAX_VISIBLE_CUSTOMERS = 5

export default function CreateProject({ showToast }: { showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const user = useAuthStore((state) => state.user)
  const customers = useCustomerStore((state) => state.customers)
  const addCustomer = useCustomerStore((state) => state.addCustomer)
  const updateCustomer = useCustomerStore((state) => state.updateCustomer)
  const addProject = useProjectStore((state) => state.addProject)
  const staff = useStaffStore((state) => state.staff)
  const projectTypes = useProjectTypeStore((state) => state.projectTypes)
  const getDefaultTaskTemplates = useProjectTypeStore((state) => state.getDefaultTaskTemplates)
  const getTaskTemplatesByProjectType = useProjectTypeStore((state) => state.getTaskTemplatesByProjectType)
  const addTaskTemplate = useProjectTypeStore((state) => state.addTaskTemplate)
  const updateTaskTemplate = useProjectTypeStore((state) => state.updateTaskTemplate)
  const deleteTaskTemplate = useProjectTypeStore((state) => state.deleteTaskTemplate)

  const existingCustomer = useMemo(
    () => customers.find((customer) => customer.id === state?.customerId),
    [customers, state?.customerId]
  )

  const supervisors = useMemo(
    () => staff.filter((member) => member.role === 'supervisor' && member.isActive),
    [staff]
  )

  const saveDraft = () => {
    const draft: DraftData = {
      step,
      selectedCustomerId,
      selectedProjectTypeId,
      projectName,
      projectFullAddress,
      projectWard,
      projectDistrict,
      projectProvince,
      projectMapsUrl,
      distanceKm,
      projectStart,
      projectEnd,
      estimatedDurationDays,
      selectedSupervisors,
      webhookUrl,
      selectedClientId,
      category,
      categoryNote,
      contractValue,
      paidAmount,
      paymentNote,
      attachments
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    showToast('Đã lưu bản nháp', 'info')
  }

  const loadDraft = () => {
    const draftStr = localStorage.getItem(DRAFT_KEY)
    if (draftStr) {
      try {
        const draft: DraftData = JSON.parse(draftStr)
        setStep(draft.step)
        setSelectedCustomerId(draft.selectedCustomerId)
        setSelectedProjectTypeId(draft.selectedProjectTypeId)
        setProjectName(draft.projectName)
        setProjectFullAddress(draft.projectFullAddress)
        setProjectWard(draft.projectWard)
        setProjectDistrict(draft.projectDistrict)
        setProjectProvince(draft.projectProvince)
        setProjectMapsUrl(draft.projectMapsUrl)
        setDistanceKm(draft.distanceKm)
        setProjectStart(draft.projectStart)
        setProjectEnd(draft.projectEnd)
        setEstimatedDurationDays(draft.estimatedDurationDays || '')
        setSelectedSupervisors(draft.selectedSupervisors)
        setWebhookUrl(draft.webhookUrl)
        setSelectedClientId(draft.selectedClientId)
        setCategory(draft.category)
        setCategoryNote(draft.categoryNote)
        setContractValue(draft.contractValue)
        setPaidAmount(draft.paidAmount)
        setPaymentNote(draft.paymentNote)
        setAttachments(draft.attachments)
        showToast('Đã tải bản nháp', 'info')
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    showToast('Đã xóa bản nháp', 'info')
  }

  const [step, setStep] = useState(1)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(existingCustomer?.id || '')
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState('')

  const [projectName, setProjectName] = useState('')
  const [projectFullAddress, setProjectFullAddress] = useState('')
  const [projectWard, setProjectWard] = useState('')
  const [projectDistrict, setProjectDistrict] = useState('')
  const [projectProvince, setProjectProvince] = useState('TP. HCM')
  const [projectMapsUrl, setProjectMapsUrl] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [projectStart, setProjectStart] = useState('')
  const [projectEnd, setProjectEnd] = useState('')
  const [estimatedDurationDays, setEstimatedDurationDays] = useState('')
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)

  const [category, setCategory] = useState<'new_construction' | 'renovation' | 'other'>('new_construction')
  const [categoryNote, setCategoryNote] = useState('')
  const [contractValue, setContractValue] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [paymentNote, setPaymentNote] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedProjectType = useMemo(
    () => projectTypes.find((type) => type.id === selectedProjectTypeId),
    [projectTypes, selectedProjectTypeId]
  )

  const selectedTemplates = useMemo(
    () => (selectedProjectTypeId ? getTaskTemplatesByProjectType(selectedProjectTypeId) : []),
    [getTaskTemplatesByProjectType, selectedProjectTypeId]
  )

  const suggestedDurationDays = useMemo(() => {
    if (!selectedProjectTypeId) return 0

    const defaultTemplates = getDefaultTaskTemplates(selectedProjectTypeId)
    const defaultTotal = defaultTemplates.reduce((sum, template) => sum + Math.max(0, template.estimatedDays || 0), 0)
    if (defaultTotal > 0) return defaultTotal

    const allTemplates = getTaskTemplatesByProjectType(selectedProjectTypeId)
    return allTemplates.reduce((sum, template) => sum + Math.max(0, template.estimatedDays || 0), 0)
  }, [getDefaultTaskTemplates, getTaskTemplatesByProjectType, selectedProjectTypeId])

  const compactCustomers = useMemo(() => customers.slice(0, MAX_VISIBLE_CUSTOMERS), [customers])

  const getVisibleCustomers = (activeCustomerId: string) => {
    const normalizedQuery = customerSearchQuery.trim().toLowerCase()
    const baseCustomers = normalizedQuery
      ? customers.filter((customer) => {
          const haystack = [customer.fullName, customer.phone, customer.email || ''].join(' ').toLowerCase()
          return haystack.includes(normalizedQuery)
        })
      : compactCustomers

    if (!activeCustomerId) {
      return baseCustomers.slice(0, MAX_VISIBLE_CUSTOMERS)
    }

    const selected = customers.find((customer) => customer.id === activeCustomerId)
    if (!selected) {
      return baseCustomers.slice(0, MAX_VISIBLE_CUSTOMERS)
    }

    const hasSelected = baseCustomers.some((customer) => customer.id === selected.id)
    if (hasSelected) {
      return baseCustomers.slice(0, MAX_VISIBLE_CUSTOMERS)
    }

    return [selected, ...baseCustomers].slice(0, MAX_VISIBLE_CUSTOMERS)
  }

  const step1CustomerOptions = useMemo(() => getVisibleCustomers(selectedCustomerId), [compactCustomers, customerSearchQuery, customers, selectedCustomerId])

  const step2CustomerOptions = useMemo(() => getVisibleCustomers(selectedClientId), [compactCustomers, customerSearchQuery, customers, selectedClientId])

  const handleNewCustomerSubmit = async (customerData: {
    fullName: string
    phone: string
    phone2?: string
    email?: string
    address?: string
    note?: string
  }) => {
    const newCustomer: Customer = {
      id: uuidv4(),
      ...customerData,
      createdAt: new Date().toISOString(),
      projectIds: []
    }
    try {
      await addCustomer(newCustomer)
      setSelectedCustomerId(newCustomer.id)
      setSelectedClientId(newCustomer.id)
      showToast('Đã thêm khách hàng mới và tự động chọn', 'success')
    } catch (error) {
      console.error('Error creating customer during project flow:', error)
      showToast(getErrorMessage(error), 'error')
    }
  }

  useEffect(() => {
    if (existingCustomer) {
      setSelectedCustomerId(existingCustomer.id)
      setSelectedClientId(existingCustomer.id)
    } else {
      // Load draft if no existing customer
      loadDraft()
    }
  }, [existingCustomer])

  useEffect(() => {
    if (selectedCustomerId && !selectedClientId) {
      setSelectedClientId(selectedCustomerId)
    }
  }, [selectedCustomerId, selectedClientId])

  useEffect(() => {
    if (!selectedProjectType) {
      return
    }

    setCategory(inferCategoryFromProjectTypeName(selectedProjectType.name))
    setCategoryNote('')
  }, [selectedProjectType])

  useEffect(() => {
    if (!selectedProjectTypeId) {
      setEstimatedDurationDays('')
      return
    }

    if (suggestedDurationDays > 0) {
      setEstimatedDurationDays(String(suggestedDurationDays))
    }
  }, [selectedProjectTypeId, suggestedDurationDays])

  useEffect(() => {
    if (!projectStart) return
    const duration = Number(estimatedDurationDays)
    if (!Number.isFinite(duration) || duration <= 0) return

    const start = new Date(projectStart)
    if (Number.isNaN(start.getTime())) return

    const autoEnd = new Date(start)
    autoEnd.setDate(autoEnd.getDate() + duration - 1)
    setProjectEnd(autoEnd.toISOString().slice(0, 10))
  }, [projectStart, estimatedDurationDays])

  const daysCount = useMemo(() => {
    if (!projectStart || !projectEnd) return 0
    const start = new Date(projectStart)
    const end = new Date(projectEnd)
    const diff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    return diff + 1
  }, [projectStart, projectEnd])

  const paidAmountNumber = Number(paidAmount.replace(/[^0-9]/g, ''))
  const contractValueNumber = Number(contractValue.replace(/[^0-9]/g, ''))
  const paidPercent = contractValueNumber > 0 ? Math.round((paidAmountNumber / contractValueNumber) * 100) : 0
  const remainingValue = contractValueNumber - paidAmountNumber

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === (selectedClientId || selectedCustomerId)) || null,
    [customers, selectedClientId, selectedCustomerId]
  )

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    const nextAttachments: Attachment[] = []
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        showToast(`File ${file.name} vượt quá 10MB`, 'error')
        continue
      }
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Đọc file thất bại'))
        reader.readAsDataURL(file)
      })
      nextAttachments.push({
        id: uuidv4(),
        name: file.name,
        url: dataUrl,
        type: file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'other',
        size: file.size,
        uploadedAt: new Date().toISOString()
      })
    }
    setAttachments((current) => [...current, ...nextAttachments].slice(0, 5))
  }

  const removeAttachment = (id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id))
  }

  const canProceedStep1 = Boolean(selectedCustomerId)
  const canProceedStep2 = Boolean(selectedClientId && projectName && selectedProjectTypeId && projectFullAddress && projectProvince && projectStart && projectEnd && Number(estimatedDurationDays) > 0 && selectedSupervisors.length > 0)
  const canProceedStep3 = contractValueNumber > 0 && paidAmountNumber >= 0

  const handleCreate = async () => {
    if (!user) {
      showToast('Phiên đăng nhập chưa sẵn sàng. Vui lòng thử lại sau vài giây.', 'error')
      return
    }
    if (isSubmitting) return
    if (!canProceedStep1 || !canProceedStep2 || !canProceedStep3) {
      showToast('Vui lòng hoàn thành đầy đủ thông tin trước khi tạo dự án', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const customerId = selectedClientId || selectedCustomerId
      if (!customerId) {
        showToast('Vui lòng chọn khách hàng trước khi tạo dự án', 'error')
        return
      }
      const projectId = uuidv4()
      const selectedClient = customers.find((c) => c.id === customerId)

      if (selectedClient) {
        await updateCustomer(selectedClient.id, {
          projectIds: Array.from(new Set([...selectedClient.projectIds, projectId]))
        })
      } else {
        showToast('Không tìm thấy khách hàng đã chọn. Vui lòng chọn lại.', 'error')
        return
      }

      let tasks: Task[] = []
      if (selectedProjectTypeId) {
        const defaultTemplates = getDefaultTaskTemplates(selectedProjectTypeId)
        tasks = defaultTemplates.map((template, index) => ({
          id: uuidv4(),
          title: template.title,
          description: '',
          status: 'todo' as TaskStatus,
          images: [],
          deadline: projectEnd,
          estimatedDays: null,
          startDate: undefined,
          completedAt: undefined,
          actualDays: null,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedBy: user.name,
          note: undefined,
          order: index + 1,
          fromTemplateId: template.id
        }))
      }

      const project: Project = {
        id: projectId,
        name: projectName,
        location: projectFullAddress,
        client: selectedClient.fullName,
        customerId,
        category,
        categoryNote: category === 'other' ? categoryNote : undefined,
        address: {
          fullAddress: projectFullAddress,
          ward: projectWard || undefined,
          district: projectDistrict || undefined,
          province: projectProvince || undefined,
          googleMapsUrl: projectMapsUrl || undefined
        },
        contractValue: contractValueNumber,
        paidAmount: paidAmountNumber,
        paymentNote: paymentNote || undefined,
        attachments,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        startDate: projectStart,
        endDate: projectEnd,
        tasks,
        createdAt: new Date().toISOString(),
        webhookUrl: webhookUrl || '',
        assignedStaff: selectedSupervisors,
        projectTypeId: selectedProjectTypeId || undefined
      }

      await addProject(project)
      showToast('✓ Đã tạo dự án thành công', 'success')
      clearDraft()
      navigate(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      showToast(getErrorMessage(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepBoxes = [1, 2, 3, 4]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Tạo dự án mới</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Wizard tạo dự án</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={loadDraft}>
              📁 Tải bản nháp
            </Button>
            <Button type="button" variant="secondary" onClick={saveDraft}>
              💾 Lưu tạm
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
              Hủy
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {stepBoxes.map((item) => (
            <div
              key={item}
              className={`min-w-[180px] rounded-3xl border px-4 py-3 text-sm font-semibold ${item === step ? 'border-brand-900 bg-brand-50 text-brand-900' : item < step ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              <div className="text-xs uppercase">Bước {item}</div>
              <div>{stepTitles[item - 1]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
              <p className="text-sm font-semibold text-slate-900">Khách hàng</p>
              <div className="mt-4 flex flex-col gap-4 lg:gap-3 lg:flex-row lg:items-end">
                <div className="w-full lg:flex-1">
                  <input
                    className="min-h-[44px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                    value={customerSearchQuery}
                    onChange={(event) => setCustomerSearchQuery(event.target.value)}
                    placeholder="Tìm thêm theo tên, số điện thoại hoặc email"
                  />
                  <label className="mt-3 block text-sm font-semibold text-slate-700">Chọn khách hàng *</label>
                  <select
                    className="mt-2 min-h-[44px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                    value={selectedCustomerId}
                    onChange={(event) => {
                      setSelectedCustomerId(event.target.value)
                      setSelectedClientId(event.target.value)
                    }}
                  >
                    <option value="">Chọn từ danh sách khách hàng gần đây</option>
                    {step1CustomerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} · {customer.phone}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">Dropdown chỉ hiển thị tối đa {MAX_VISIBLE_CUSTOMERS} kết quả để biểu mẫu gọn. Có thể tìm trên toàn bộ danh sách ở ô phía trên.</p>
                </div>
                <Button type="button" variant="secondary" className="min-h-[44px] w-full lg:w-auto" onClick={() => setShowNewCustomerModal(true)}>
                  + Thêm khách hàng mới
                </Button>
              </div>

              {selectedCustomer ? (
                <div className="mt-4 rounded-3xl border border-brand-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{selectedCustomer.fullName}</p>
                    <Badge label="Đã chọn" type="primary" />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">📱 {selectedCustomer.phone}</p>
                  {selectedCustomer.email ? <p className="mt-1 text-sm text-slate-600">✉ {selectedCustomer.email}</p> : null}
                  {selectedCustomer.address ? <p className="mt-1 text-sm text-slate-600">📍 {selectedCustomer.address}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Chủ đầu tư *</label>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <div className="w-full lg:flex-1">
                    <input
                      className="min-h-[44px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                      value={customerSearchQuery}
                      onChange={(event) => setCustomerSearchQuery(event.target.value)}
                      placeholder="Tìm khách hàng trong toàn bộ danh sách"
                    />
                    <select
                      className="mt-2 min-h-[44px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                      value={selectedClientId}
                      onChange={(event) => {
                        setSelectedClientId(event.target.value)
                        setSelectedCustomerId(event.target.value)
                      }}
                    >
                      <option value="">Chọn chủ đầu tư</option>
                      {step2CustomerOptions.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.fullName}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">Danh sách rút gọn để thao tác nhanh. Ô tìm kiếm vẫn quét toàn bộ khách hàng hiện có.</p>
                  </div>
                  <Button type="button" variant="secondary" className="min-h-[44px] w-full lg:w-auto" onClick={() => setShowNewCustomerModal(true)}>
                    + Thêm khách hàng mới
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Tên dự án *</label>
                <input
                  className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="VD: Nhà phố 3 tầng - Nguyễn Văn A"
                />
                <p className="text-xs text-slate-500">Tên sẽ hiển thị trên toàn bộ báo cáo.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Loại dự án *</label>
                <select
                  className="min-h-[44px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                  value={selectedProjectTypeId}
                  onChange={(event) => setSelectedProjectTypeId(event.target.value)}
                >
                  <option value="">Chọn loại dự án</option>
                  {projectTypes.filter(pt => pt.isActive).map((projectType) => (
                    <option key={projectType.id} value={projectType.id}>
                      {projectType.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">Tasks sẽ được tạo tự động từ template.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-6">
              <p className="text-sm font-semibold text-slate-900">Địa chỉ thi công *</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  className="min-h-[44px] rounded-3xl border border-slate-200 px-4 py-3"
                  value={projectFullAddress}
                  onChange={(event) => setProjectFullAddress(event.target.value)}
                  placeholder="Số nhà, tên đường"
                />
                <input
                  className="min-h-[44px] rounded-3xl border border-slate-200 px-4 py-3"
                  value={projectWard}
                  onChange={(event) => setProjectWard(event.target.value)}
                  placeholder="Phường / Xã"
                />
                <input
                  className="min-h-[44px] rounded-3xl border border-slate-200 px-4 py-3"
                  value={projectDistrict}
                  onChange={(event) => setProjectDistrict(event.target.value)}
                  placeholder="Quận / Huyện"
                />
                <select
                  className="min-h-[44px] rounded-3xl border border-slate-200 bg-white px-4 py-3"
                  value={projectProvince}
                  onChange={(event) => setProjectProvince(event.target.value)}
                >
                  {provinces.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-semibold text-slate-700">Link Google Maps</label>
                  <input
                    className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                    value={projectMapsUrl}
                    onChange={(event) => setProjectMapsUrl(event.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                  {projectMapsUrl ? (
                    <a href={projectMapsUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-700 underline">📍 Mở bản đồ</a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-slate-700">Khoảng cách từ văn phòng</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                    value={distanceKm}
                    onChange={(event) => setDistanceKm(event.target.value)}
                    placeholder="Số km"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">km</span>
                </div>
                <p className="text-xs text-slate-500">Dùng để tính chi phí di chuyển.</p>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Ngày khởi công *</label>
                  <input
                    type="date"
                    className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                    value={projectStart}
                    onChange={(event) => {
                      setProjectStart(event.target.value)
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Tổng thời gian dự kiến (ngày) *</label>
                  <input
                    type="number"
                    min="1"
                    className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                    value={estimatedDurationDays}
                    onChange={(event) => setEstimatedDurationDays(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="VD: 30"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Ngày dự kiến bàn giao *</label>
                  <input
                    type="date"
                    className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                    value={projectEnd}
                    onChange={(event) => {
                      const nextEnd = event.target.value
                      setProjectEnd(nextEnd)
                      if (projectStart && nextEnd) {
                        const start = new Date(projectStart)
                        const end = new Date(nextEnd)
                        const diff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
                        setEstimatedDurationDays(String(diff + 1))
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500">Tự động tính theo ngày khởi công + tổng thời gian, nhưng vẫn có thể chỉnh tay.</p>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Tổng số ngày thi công</label>
                  <input
                    readOnly
                    className="min-h-[44px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                    value={daysCount ? `${daysCount} ngày` : ''}
                    placeholder="Tự tính"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-4 sm:p-6">
              <p className="text-sm font-semibold text-slate-900">Giám sát viên phụ trách *</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {supervisors.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={`rounded-3xl border p-4 text-left ${selectedSupervisors.includes(member.id) ? 'border-brand-900 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    onClick={() => {
                      setSelectedSupervisors((current) =>
                        current.includes(member.id)
                          ? current.filter((id) => id !== member.id)
                          : [...current, member.id]
                      )
                    }}
                  >
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{member.phone}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Webhook URL</label>
              <input
                className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="https://n8n.yourdomain.com/webhook/..."
              />
              <p className="text-xs text-slate-500">Để trống nếu chưa cần thông báo tự động.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-slate-700">Giá trị hợp đồng (VNĐ) *</label>
                <input
                  type="text"
                  className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                  value={contractValue}
                  onChange={(event) => setContractValue(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1500000000"
                />
                <p className="text-xs text-slate-500">{formatContractValueLabel(contractValueNumber)}</p>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-slate-700">Đã thanh toán (VNĐ)</label>
                <input
                  type="text"
                  className="min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                  value={paidAmount}
                  onChange={(event) => setPaidAmount(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                />
                <p className="text-xs text-slate-500">Đã thanh toán {paidPercent}% · còn lại {formatCurrency(Math.max(0, remainingValue))} đ</p>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-slate-700">Tỷ lệ thanh toán</label>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 h-[62px] flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{paidPercent}%</span>
                </div>
                <p className="text-xs text-slate-500">Tiến độ thanh toán</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Progress thanh toán tổng thể</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white shadow-inner">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, paidPercent)}%` }} />
              </div>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Ghi chú thanh toán</label>
              <textarea
                className="min-h-[100px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="VD: Đợt 1 - 30% khi ký HĐ, Đợt 2 - 40% khi xong phần thô..."
              />
            </div>

            <div className="rounded-3xl border border-slate-200 p-4 sm:p-6">
              <p className="text-sm font-semibold text-slate-900">Đính kèm (tối đa 5 file)</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="cursor-pointer min-h-[44px] flex items-center rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  📎 Chọn file
                  <input type="file" hidden multiple accept=".pdf,image/png,image/jpeg" onChange={handleFileChange} />
                </label>
              </div>
              <div className="mt-4 space-y-2">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" className="text-sm text-rose-600" onClick={() => removeAttachment(file.id)}>
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Khách hàng</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{selectedCustomer?.fullName || 'Chưa chọn khách hàng'}</p>
                <p className="mt-2 text-sm text-slate-600">{selectedCustomer?.phone || '---'}</p>
                {selectedCustomer?.address ? <p className="mt-1 text-sm text-slate-600">{selectedCustomer.address}</p> : null}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Dự án</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{projectName}</p>
                <p className="mt-2 text-sm text-slate-600">{projectFullAddress}</p>
                <p className="mt-2 text-sm text-slate-600">{projectStart && projectEnd ? `${formatDate(projectStart)} → ${formatDate(projectEnd)} (${daysCount} ngày)` : ''}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Tài chính</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{formatCurrency(contractValueNumber)} đ</p>
                <p className="mt-2 text-sm text-slate-600">Đã TT: {formatCurrency(paidAmountNumber)} đ ({paidPercent}%)</p>
                <p className="mt-2 text-sm text-slate-600">Còn lại: {formatCurrency(Math.max(0, remainingValue))} đ</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">Tổng quan triển khai</p>
              <p className="mt-3 text-sm text-slate-600">Loại dự án: {selectedProjectType?.name || 'Chưa chọn'}</p>
              <p className="mt-4 text-sm text-slate-600">Giám sát: {selectedSupervisors.map((id) => supervisors.find((member) => member.id === id)?.name).filter(Boolean).join(', ')}</p>
              <p className="mt-2 text-sm text-slate-600">Webhook: {webhookUrl || 'Chưa cấu hình'}</p>
              <p className="mt-2 text-sm text-slate-600">Tệp đính kèm: {attachments.length} file</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" className="min-h-[44px] w-full sm:w-auto" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}>
          ← Quay lại
        </Button>
        {step < 4 ? (
          <Button
            type="button"
            className="min-h-[44px] w-full sm:w-auto"
            onClick={() => {
              if (step === 1 && !canProceedStep1) {
                showToast('Vui lòng chọn hoặc tạo khách hàng trước khi tiếp tục', 'error')
                return
              }
              if (step === 2 && !canProceedStep2) {
                showToast('Vui lòng hoàn thành thông tin dự án trước khi tiếp tục', 'error')
                return
              }
              if (step === 3 && !canProceedStep3) {
                showToast('Vui lòng hoàn thành thông tin tài chính trước khi tiếp tục', 'error')
                return
              }
              setStep((value) => Math.min(4, value + 1))
            }}
          >
            Tiếp theo →
          </Button>
        ) : (
          <Button type="button" className="min-h-[44px] w-full sm:w-auto" onClick={() => void handleCreate()} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu dự án...' : 'Tạo dự án ✓'}
          </Button>
        )}
      </div>
      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onSubmit={handleNewCustomerSubmit}
      />
    </div>
  )
}
