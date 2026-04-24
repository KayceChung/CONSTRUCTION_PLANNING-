import { Attachment, AuthSession, ChangeLog, Customer, InteractionLog, Project, ProjectType, Staff, Task, TaskTemplate, User } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'constructtrack_data'
const SESSION_KEY = 'constructtrack_session'

function mapTaskFromRow(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    images: row.images || [],
    deadline: row.deadline,
    estimatedDays: row.estimated_days,
    startDate: row.start_date || undefined,
    completedAt: row.completed_at || undefined,
    actualDays: row.actual_days ?? null,
    updatedAt: row.updated_at || row.created_at,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    note: row.note || undefined,
    order: row.sort_order ?? 0,
    fromTemplateId: row.from_template_id || null,
    assignee: row.assignee || undefined,
    taskDeadline: row.task_deadline || undefined,
  }
}

function mapTaskToRow(task: Task, projectId: string) {
  return {
    id: task.id,
    project_id: projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    images: task.images,
    deadline: task.deadline,
    estimated_days: task.estimatedDays,
    start_date: task.startDate || null,
    completed_at: task.completedAt || null,
    actual_days: task.actualDays ?? null,
    updated_by: task.updatedBy,
    note: task.note || null,
    sort_order: task.order,
    from_template_id: task.fromTemplateId || null,
    assignee: task.assignee || null,
    task_deadline: task.taskDeadline || null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }
}

function mapAttachmentFromRow(row: any): Attachment {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    size: row.size,
    uploadedAt: row.uploaded_at,
  }
}

function mapAttachmentToRow(attachment: Attachment, projectId: string) {
  return {
    id: attachment.id,
    project_id: projectId,
    name: attachment.name,
    url: attachment.url,
    type: attachment.type,
    size: attachment.size,
    uploaded_at: attachment.uploadedAt,
  }
}

function mapProjectFromRow(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    client: row.client,
    customerId: row.customer_id,
    category: row.category,
    categoryNote: row.category_note || undefined,
    address: {
      fullAddress: row.address_full,
      ward: row.address_ward || undefined,
      district: row.address_district || undefined,
      province: row.address_province || undefined,
      googleMapsUrl: row.address_google_maps_url || undefined,
    },
    contractValue: Number(row.contract_value || 0),
    paidAmount: Number(row.paid_amount || 0),
    paymentNote: row.payment_note || undefined,
    attachments: Array.isArray(row.attachments) ? row.attachments.map(mapAttachmentFromRow) : [],
    distanceKm: row.distance_km == null ? undefined : Number(row.distance_km),
    startDate: row.start_date,
    endDate: row.end_date,
    tasks: Array.isArray(row.tasks)
      ? (row.tasks.map(mapTaskFromRow) as Task[]).sort((left: Task, right: Task) => left.order - right.order)
      : [],
    createdAt: row.created_at,
    webhookUrl: row.webhook_url || '',
    assignedStaff: row.assigned_staff || [],
    projectTypeId: row.project_type_id || null,
    notes: row.notes || undefined,
    zaloGroupThreadId: row.zalo_group_thread_id || undefined,
    zaloGroupName: row.zalo_group_name || undefined,
    zaloLinkedAt: row.zalo_linked_at || undefined,
    zaloStatus: row.zalo_status || null,
  }
}

function mapProjectToRow(project: Project) {
  return {
    id: project.id,
    name: project.name,
    location: project.location,
    client: project.client,
    customer_id: project.customerId,
    category: project.category,
    category_note: project.categoryNote || null,
    address_full: project.address.fullAddress,
    address_ward: project.address.ward || null,
    address_district: project.address.district || null,
    address_province: project.address.province || null,
    address_google_maps_url: project.address.googleMapsUrl || null,
    contract_value: project.contractValue,
    paid_amount: project.paidAmount,
    payment_note: project.paymentNote || null,
    distance_km: project.distanceKm ?? null,
    start_date: project.startDate,
    end_date: project.endDate,
    webhook_url: project.webhookUrl,
    assigned_staff: project.assignedStaff,
    project_type_id: project.projectTypeId || null,
    notes: project.notes || null,
    zalo_group_thread_id: project.zaloGroupThreadId || null,
    zalo_group_name: project.zaloGroupName || null,
    zalo_linked_at: project.zaloLinkedAt || null,
    zalo_status: project.zaloStatus || null,
    created_at: project.createdAt,
    updated_at: new Date().toISOString(),
  }
}

function mapStaffFromRow(row: any): Staff {
  return {
    id: row.id,
    name: row.name || row.full_name || row.email || '',
    phone: row.phone || '',
    phone1: row.phone1 || undefined,
    phone2: row.phone2 || undefined,
    email: row.email || undefined,
    role: row.role,
    assignedProjects: [],
    avatar: row.avatar || undefined,
    pinHash: undefined,
    isActive: row.is_active ?? false,
    createdAt: row.created_at,
  }
}

function mapCustomerFromRow(row: any): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    phone2: row.phone2 || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    source: row.source || undefined,
    status: row.status || 'lead',
    note: row.note || undefined,
    notes: row.notes || undefined,
    zaloThreadId: row.zalo_thread_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
    projectIds: [],
  }
}

function mapCustomerToRow(customer: Customer) {
  return {
    id: customer.id,
    full_name: customer.fullName,
    phone: customer.phone,
    phone2: customer.phone2 || null,
    email: customer.email || null,
    address: customer.address || null,
    source: customer.source || null,
    status: customer.status || 'lead',
    note: customer.note || null,
    notes: customer.notes || null,
    zalo_thread_id: customer.zaloThreadId || null,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt || new Date().toISOString(),
  }
}

function mapInteractionLogFromRow(row: any): InteractionLog {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    date: row.date,
    time: row.time || undefined,
    summary: row.summary,
    nextAction: row.next_action || undefined,
    nextActionDate: row.next_action_date || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function mapInteractionLogToRow(log: InteractionLog) {
  return {
    id: log.id,
    customer_id: log.customerId,
    type: log.type,
    date: log.date,
    time: log.time || null,
    summary: log.summary,
    next_action: log.nextAction || null,
    next_action_date: log.nextActionDate || null,
    created_by: log.createdBy,
    created_at: log.createdAt,
  }
}

function mapProjectTypeFromRow(row: any): ProjectType {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapProjectTypeToRow(projectType: ProjectType) {
  return {
    id: projectType.id,
    name: projectType.name,
    color: projectType.color,
    is_active: projectType.isActive,
    created_at: projectType.createdAt,
    updated_at: projectType.updatedAt,
  }
}

function mapTaskTemplateFromRow(row: any): TaskTemplate {
  return {
    id: row.id,
    projectTypeId: row.project_type_id,
    title: row.title,
    sortOrder: row.sort_order,
    isDefault: row.is_default ?? true,
    estimatedDays: row.estimated_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTaskTemplateToRow(taskTemplate: TaskTemplate) {
  return {
    id: taskTemplate.id,
    project_type_id: taskTemplate.projectTypeId,
    title: taskTemplate.title,
    sort_order: taskTemplate.sortOrder,
    is_default: taskTemplate.isDefault,
    estimated_days: taskTemplate.estimatedDays,
    created_at: taskTemplate.createdAt,
    updated_at: taskTemplate.updatedAt,
  }
}

export async function loadProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      tasks (*),
      attachments (*)
    `)
  if (error) throw error
  return (data || []).map(mapProjectFromRow)
}

export async function saveProjects(projects: Project[]): Promise<void> {
  const projectRows = projects.map(mapProjectToRow)
  const taskRows = projects.flatMap((project) => project.tasks.map((task) => mapTaskToRow(task, project.id)))
  const attachmentRows = projects.flatMap((project) => project.attachments.map((attachment) => mapAttachmentToRow(attachment, project.id)))

  const { error: projectError } = await supabase
    .from('projects')
    .upsert(projectRows, { onConflict: 'id' })
  if (projectError) throw projectError

  if (taskRows.length > 0) {
    const { error: taskError } = await supabase
      .from('tasks')
      .upsert(taskRows, { onConflict: 'id' })
    if (taskError) throw taskError
  }

  if (attachmentRows.length > 0) {
    const { error: attachmentError } = await supabase
      .from('attachments')
      .upsert(attachmentRows, { onConflict: 'id' })
    if (attachmentError) throw attachmentError
  }
}

function mapProjectChangesToRow(changes: Partial<Project>) {
  const updateRow: Record<string, unknown> = {}

  if (changes.name !== undefined) updateRow.name = changes.name
  if (changes.location !== undefined) updateRow.location = changes.location
  if (changes.client !== undefined) updateRow.client = changes.client
  if (changes.customerId !== undefined) updateRow.customer_id = changes.customerId
  if (changes.category !== undefined) updateRow.category = changes.category
  if (changes.categoryNote !== undefined) updateRow.category_note = changes.categoryNote || null
  if (changes.address !== undefined) {
    updateRow.address_full = changes.address.fullAddress
    updateRow.address_ward = changes.address.ward || null
    updateRow.address_district = changes.address.district || null
    updateRow.address_province = changes.address.province || null
    updateRow.address_google_maps_url = changes.address.googleMapsUrl || null
  }
  if (changes.contractValue !== undefined) updateRow.contract_value = changes.contractValue
  if (changes.paidAmount !== undefined) updateRow.paid_amount = changes.paidAmount
  if (changes.paymentNote !== undefined) updateRow.payment_note = changes.paymentNote || null
  if (changes.distanceKm !== undefined) updateRow.distance_km = changes.distanceKm ?? null
  if (changes.startDate !== undefined) updateRow.start_date = changes.startDate
  if (changes.endDate !== undefined) updateRow.end_date = changes.endDate
  if (changes.webhookUrl !== undefined) updateRow.webhook_url = changes.webhookUrl
  if (changes.assignedStaff !== undefined) updateRow.assigned_staff = changes.assignedStaff
  if (changes.projectTypeId !== undefined) updateRow.project_type_id = changes.projectTypeId || null
  if (changes.notes !== undefined) updateRow.notes = changes.notes || null
  if (changes.zaloGroupThreadId !== undefined) updateRow.zalo_group_thread_id = changes.zaloGroupThreadId || null
  if (changes.zaloGroupName !== undefined) updateRow.zalo_group_name = changes.zaloGroupName || null
  if (changes.zaloLinkedAt !== undefined) updateRow.zalo_linked_at = changes.zaloLinkedAt || null
  if (changes.zaloStatus !== undefined) updateRow.zalo_status = changes.zaloStatus || null

  return updateRow
}

function mapTaskChangesToRow(changes: Partial<Task>) {
  const updateRow: Record<string, unknown> = {}

  if (changes.title !== undefined) updateRow.title = changes.title
  if (changes.description !== undefined) updateRow.description = changes.description
  if (changes.status !== undefined) updateRow.status = changes.status
  if (changes.images !== undefined) updateRow.images = changes.images
  if (changes.deadline !== undefined) updateRow.deadline = changes.deadline
  if (changes.estimatedDays !== undefined) updateRow.estimated_days = changes.estimatedDays
  if (changes.startDate !== undefined) updateRow.start_date = changes.startDate || null
  if (changes.completedAt !== undefined) updateRow.completed_at = changes.completedAt || null
  if (changes.actualDays !== undefined) updateRow.actual_days = changes.actualDays ?? null
  if (changes.updatedBy !== undefined) updateRow.updated_by = changes.updatedBy
  if (changes.note !== undefined) updateRow.note = changes.note || null
  if (changes.order !== undefined) updateRow.sort_order = changes.order
  if (changes.fromTemplateId !== undefined) updateRow.from_template_id = changes.fromTemplateId || null
  if (changes.assignee !== undefined) updateRow.assignee = changes.assignee || null
  if (changes.taskDeadline !== undefined) updateRow.task_deadline = changes.taskDeadline || null
  if (changes.createdAt !== undefined) updateRow.created_at = changes.createdAt
  if (changes.updatedAt !== undefined) updateRow.updated_at = changes.updatedAt

  return updateRow
}

async function syncProjectTasks(projectId: string, tasks: Task[]): Promise<void> {
  const { data: existingTasks, error: existingTasksError } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', projectId)

  if (existingTasksError) throw existingTasksError

  const nextTaskIds = new Set(tasks.map((task) => task.id))
  const taskIdsToDelete = (existingTasks || [])
    .map((task) => task.id as string)
    .filter((taskId) => !nextTaskIds.has(taskId))

  if (taskIdsToDelete.length > 0) {
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIdsToDelete)

    if (deleteTasksError) throw deleteTasksError
  }

  if (tasks.length === 0) return

  const { error: taskError } = await supabase
    .from('tasks')
    .upsert(tasks.map((task) => mapTaskToRow(task, projectId)), { onConflict: 'id' })

  if (taskError) throw taskError
}

async function syncProjectAttachments(projectId: string, attachments: Attachment[]): Promise<void> {
  const { data: existingAttachments, error: existingAttachmentsError } = await supabase
    .from('attachments')
    .select('id')
    .eq('project_id', projectId)

  if (existingAttachmentsError) throw existingAttachmentsError

  const nextAttachmentIds = new Set(attachments.map((attachment) => attachment.id))
  const attachmentIdsToDelete = (existingAttachments || [])
    .map((attachment) => attachment.id as string)
    .filter((attachmentId) => !nextAttachmentIds.has(attachmentId))

  if (attachmentIdsToDelete.length > 0) {
    const { error: deleteAttachmentsError } = await supabase
      .from('attachments')
      .delete()
      .in('id', attachmentIdsToDelete)

    if (deleteAttachmentsError) throw deleteAttachmentsError
  }

  if (attachments.length === 0) return

  const { error: attachmentError } = await supabase
    .from('attachments')
    .upsert(attachments.map((attachment) => mapAttachmentToRow(attachment, projectId)), { onConflict: 'id' })

  if (attachmentError) throw attachmentError
}

export async function createProjectRecord(project: Project): Promise<void> {
  const { error: projectError } = await supabase
    .from('projects')
    .insert(mapProjectToRow(project))

  if (projectError) throw projectError

  await Promise.all([
    syncProjectTasks(project.id, project.tasks),
    syncProjectAttachments(project.id, project.attachments)
  ])
}

export async function updateProjectRecord(projectId: string, changes: Partial<Project>): Promise<void> {
  const updateRow = mapProjectChangesToRow(changes)

  if (Object.keys(updateRow).length > 0) {
    updateRow.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('projects')
      .update(updateRow)
      .eq('id', projectId)

    if (error) throw error
  }

  const syncOperations: Promise<void>[] = []

  if (changes.tasks !== undefined) {
    syncOperations.push(syncProjectTasks(projectId, changes.tasks))
  }

  if (changes.attachments !== undefined) {
    syncOperations.push(syncProjectAttachments(projectId, changes.attachments))
  }

  if (syncOperations.length > 0) {
    await Promise.all(syncOperations)
  }
}

export async function deleteProjectRecord(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}

export async function createTaskRecord(projectId: string, task: Task): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .insert(mapTaskToRow(task, projectId))

  if (error) throw error
}

export async function updateTaskRecord(taskId: string, changes: Partial<Task>): Promise<void> {
  const updateRow = mapTaskChangesToRow(changes)

  if (Object.keys(updateRow).length === 0) return

  if (!('updated_at' in updateRow)) {
    updateRow.updated_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('tasks')
    .update(updateRow)
    .eq('id', taskId)

  if (error) throw error
}

export async function deleteTaskRecord(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
}

export async function loadStaff(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
  if (error) throw error
  return (data || []).map(mapStaffFromRow)
}

export async function saveStaff(staff: Staff[]): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .upsert(
      staff.map((member) => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
        phone1: member.phone1 || null,
        phone2: member.phone2 || null,
        email: member.email || null,
        role: member.role,
        avatar: member.avatar || null,
        is_active: member.isActive,
        created_at: member.createdAt,
      })),
      { onConflict: 'id' }
    )
  if (error) throw error
}

export async function updateStaffRecord(staffId: string, changes: Partial<Staff>): Promise<void> {
  const updateRow: Record<string, unknown> = {}

  if (changes.name !== undefined) updateRow.name = changes.name
  if (changes.phone !== undefined) updateRow.phone = changes.phone
  if (changes.phone1 !== undefined) updateRow.phone1 = changes.phone1 || null
  if (changes.phone2 !== undefined) updateRow.phone2 = changes.phone2 || null
  if (changes.email !== undefined) updateRow.email = changes.email || null
  if (changes.role !== undefined) updateRow.role = changes.role
  if (changes.avatar !== undefined) updateRow.avatar = changes.avatar || null
  if (changes.isActive !== undefined) updateRow.is_active = changes.isActive

  if (Object.keys(updateRow).length === 0) {
    return
  }

  const { error } = await supabase
    .from('staff')
    .update(updateRow)
    .eq('id', staffId)

  if (error) throw error
}

export async function deleteStaffRecord(staffId: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', staffId)

  if (error) throw error
}

export async function loadCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
  if (error) throw error
  return (data || []).map(mapCustomerFromRow)
}

export async function createCustomerRecord(customer: Customer): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert(mapCustomerToRow(customer))
    .select('*')
    .single()

  if (error) throw error

  return mapCustomerFromRow(data)
}

export async function deleteCustomerRecord(customerId: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (error) throw error
}

export async function saveCustomers(customers: Customer[]): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .upsert(customers.map(mapCustomerToRow), { onConflict: 'id' })
  if (error) throw error
}

export async function loadInteractionLogs(): Promise<InteractionLog[]> {
  const { data, error } = await supabase
    .from('interaction_logs')
    .select('*')
  if (error) throw error
  return (data || []).map(mapInteractionLogFromRow)
}

export async function saveInteractionLogs(interactionLogs: InteractionLog[]): Promise<void> {
  const { error } = await supabase
    .from('interaction_logs')
    .upsert(interactionLogs.map(mapInteractionLogToRow), { onConflict: 'id' })
  if (error) throw error
}

export async function loadProjectTypes(): Promise<ProjectType[]> {
  const { data, error } = await supabase
    .from('project_types')
    .select('*')
  if (error) throw error
  return (data || []).map(mapProjectTypeFromRow)
}

export async function saveProjectTypes(projectTypes: ProjectType[]): Promise<void> {
  const { error } = await supabase
    .from('project_types')
    .upsert(projectTypes.map(mapProjectTypeToRow), { onConflict: 'id' })
  if (error) throw error
}

export async function loadTaskTemplates(): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
  if (error) throw error
  return (data || []).map(mapTaskTemplateFromRow)
}

export async function saveTaskTemplates(taskTemplates: TaskTemplate[]): Promise<void> {
  const { error } = await supabase
    .from('task_templates')
    .upsert(taskTemplates.map(mapTaskTemplateToRow), { onConflict: 'id' })
  if (error) throw error
}

export function createSeedStaff(): Staff[] {
  return [
    {
      id: 'staff-manager',
      name: 'Trần Quản Lý',
      phone: '0909123456',
      email: 'quanly@demo.vn',
      role: 'manager',
      assignedProjects: ['proj-q7', 'proj-bd'],
      avatar: 'TQ',
      pinHash: btoa('1234' + 'staff-manager'),
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'staff-nga',
      name: 'Nguyễn Giám Sát',
      phone: '0912345678',
      email: 'giasat@demo.vn',
      role: 'supervisor',
      assignedProjects: ['proj-q7'],
      avatar: 'NG',
      pinHash: btoa('5678' + 'staff-nga'),
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'staff-hoa',
      name: 'Lê Thị Hoa',
      phone: '0987654321',
      email: 'lehoa@demo.vn',
      role: 'supervisor',
      assignedProjects: ['proj-bd'],
      avatar: 'LH',
      pinHash: btoa('9999' + 'staff-hoa'),
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]
}

export function createSeedCustomers(): Customer[] {
  return [
    {
      id: 'cust-an',
      fullName: 'Nguyễn Văn An',
      phone: '0901111222',
      email: 'an.q7@example.com',
      address: 'Quận 7, TP. HCM',
      status: 'contracted',
      note: 'Khách hàng quen, ưu tiên báo cáo qua Zalo',
      createdAt: new Date().toISOString(),
      projectIds: ['proj-q7']
    },
    {
      id: 'cust-binh',
      fullName: 'Trần Thị Bình',
      phone: '0912333444',
      email: 'binh.bd@example.com',
      address: 'Bình Dương',
      note: 'Khách cần báo cáo tiến độ 2 tuần/lần',
      createdAt: new Date().toISOString(),
      projectIds: ['proj-bd']
    },
    {
      id: 'cust-cuong',
      fullName: 'Lê Hoàng Cường',
      phone: '0777447107',
      address: 'Quận 2, TP. HCM',
      status: 'lead',
      createdAt: new Date().toISOString(),
      projectIds: []
    }
  ]
}

export function createSeedInteractionLogs(): InteractionLog[] {
  return [
    {
      id: 'log-1',
      customerId: 'cust-an',
      type: 'call',
      date: '2025-01-15',
      time: '14:30',
      summary: 'Gọi trao đổi tiến độ và xác nhận bản vẽ thi công.',
      nextAction: 'Gửi bản vẽ đã chỉnh sửa',
      nextActionDate: '2025-01-20',
      createdBy: 'Trần Quản Lý',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-2',
      customerId: 'cust-an',
      type: 'zalo',
      date: '2025-03-08',
      time: '10:15',
      summary: 'Gửi hình ảnh tiến độ phần móng và xin phản hồi.',
      nextAction: 'Theo dõi phản hồi khách hàng',
      nextActionDate: '2025-03-10',
      createdBy: 'Nguyễn Giám Sát',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-3',
      customerId: 'cust-an',
      type: 'meet',
      date: '2025-04-22',
      time: '16:00',
      summary: 'Đón khách tại công trường và thảo luận tổng kết thi công.',
      nextAction: 'Chuẩn bị báo cáo hoàn thành',
      nextActionDate: '2025-04-25',
      createdBy: 'Lê Thị Hoa',
      createdAt: new Date().toISOString()
    }
  ]
}

export function createSeedProjects(): Project[] {
  return [
    {
      id: 'proj-q7',
      name: 'Nhà phố 3 tầng - Q7 TPHCM',
      location: 'Quận 7, TP. HCM',
      client: 'Công ty Xây Dựng ABC',
      customerId: 'cust-an',
      category: 'new_construction',
      categoryNote: undefined,
      address: {
        fullAddress: '123 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7',
        ward: 'Phường Tân Hưng',
        district: 'Quận 7',
        province: 'TP. HCM',
        googleMapsUrl: ''
      },
      contractValue: 1500000000,
      paidAmount: 450000000,
      paymentNote: 'Đợt 1 - 30% khi ký HĐ',
      attachments: [],
      distanceKm: 18,
      startDate: '2025-05-01',
      endDate: '2025-11-15',
      createdAt: new Date().toISOString(),
      webhookUrl: 'https://yi7a1c8g.rpcld.co/webhook/00b8a546-422b-4786-ad00-0105bb20c435',
      assignedStaff: ['staff-manager', 'staff-nga'],
      projectTypeId: '1', // Xây dựng nhà phố
      tasks: [
        {
          id: 't1-mong',
          title: 'Đổ móng',
          description: 'Hoàn thành phần móng và cốt thép',
          status: 'done',
          images: [],
          deadline: '2025-05-16',
          estimatedDays: 15,
          startDate: '2025-05-01',
          completedAt: '2025-05-16',
          actualDays: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 1,
          fromTemplateId: '4' // Đào móng
        },
        {
          id: 't2-tuong1',
          title: 'Xây tường tầng 1',
          description: 'Xây dựng phần tường tầng 1',
          status: 'done',
          images: [],
          deadline: '2025-05-29',
          estimatedDays: 12,
          startDate: '2025-05-17',
          completedAt: '2025-05-29',
          actualDays: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 2,
          fromTemplateId: '6' // Xây dựng khung nhà
        },
        {
          id: 't3-tuong2',
          title: 'Xây tường tầng 2',
          description: 'Thi công phần tường tầng 2',
          status: 'in_progress',
          images: [],
          deadline: '2025-06-11',
          estimatedDays: 12,
          startDate: '2025-05-30',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 3
        },
        {
          id: 't4-tuong3',
          title: 'Xây tường tầng 3',
          description: 'Hoàn thiện khung và tường tầng 3',
          status: 'todo',
          images: [],
          deadline: '2025-06-22',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 4
        },
        {
          id: 't5-mai',
          title: 'Lợp mái',
          description: 'Thi công hệ mái và chống thấm',
          status: 'todo',
          images: [],
          deadline: '2025-07-02',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 5
        },
        {
          id: 't6-dien',
          title: 'Lắp điện',
          description: 'Hoàn thiện phần điện nước',
          status: 'pending',
          images: [],
          deadline: '2025-07-14',
          estimatedDays: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          order: 6
        },
        {
          id: 't7-nuoc',
          title: 'Lắp nước',
          description: 'Thi công hệ thống nước sinh hoạt',
          status: 'todo',
          images: [],
          deadline: '2025-07-24',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          order: 7
        },
        {
          id: 't8-son',
          title: 'Sơn hoàn thiện',
          description: 'Sơn nội thất và ngoại thất',
          status: 'todo',
          images: [],
          deadline: '2025-08-03',
          estimatedDays: 7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 8
        },
        {
          id: 't9-hoanthien',
          title: 'Hoàn thiện nội thất',
          description: 'Lắp đặt đồ nội thất và hoàn thiện cuối cùng',
          status: 'todo',
          images: [],
          deadline: '2025-08-15',
          estimatedDays: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 9
        }
      ]
    },
    {
      id: 'proj-bd',
      name: 'Biệt thự - Bình Dương',
      location: 'Bình Dương',
      client: 'Chủ đầu tư K',
      customerId: 'cust-binh',
      category: 'renovation',
      address: {
        fullAddress: 'Số 7, Khu đô thị Mỹ Phước, Bình Dương',
        ward: 'Phường Mỹ Phước',
        district: 'Thị xã Bến Cát',
        province: 'Bình Dương',
        googleMapsUrl: ''
      },
      contractValue: 2800000000,
      paidAmount: 1200000000,
      paymentNote: 'Đã thanh toán 40% ban đầu',
      attachments: [],
      distanceKm: 45,
      startDate: '2025-04-10',
      endDate: '2025-12-05',
      createdAt: new Date().toISOString(),
      webhookUrl: '',
      assignedStaff: ['staff-manager', 'staff-hoa'],
      tasks: [
        {
          id: 'b1-mong',
          title: 'Đổ móng',
          description: 'Thi công phần móng, ép cọc',
          status: 'done',
          images: [],
          deadline: '2025-04-25',
          estimatedDays: 15,
          startDate: '2025-04-10',
          completedAt: '2025-04-25',
          actualDays: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 1
        },
        {
          id: 'b2-tuong1',
          title: 'Xây tường tầng 1',
          description: 'Thi công tường tầng 1',
          status: 'done',
          images: [],
          deadline: '2025-05-06',
          estimatedDays: 12,
          startDate: '2025-04-25',
          completedAt: '2025-05-07',
          actualDays: 13,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 2
        },
        {
          id: 'b3-tuong2',
          title: 'Xây tường tầng 2',
          description: 'Thi công phần tường tầng 2',
          status: 'in_progress',
          images: [],
          deadline: '2025-05-20',
          estimatedDays: 12,
          startDate: '2025-05-08',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 3
        },
        {
          id: 'b4-ho-boi',
          title: 'Xây hồ bơi',
          description: 'Thi công hồ bơi và chống thấm',
          status: 'todo',
          images: [],
          deadline: '2025-06-01',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 4
        },
        {
          id: 'b5-san-vuon',
          title: 'Hoàn thiện sân vườn',
          description: 'Thi công sân vườn và cảnh quan',
          status: 'adjustment',
          images: [],
          deadline: '2025-06-11',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          note: 'Cần điều chỉnh vị trí cây xanh',
          order: 5
        },
        {
          id: 'b6-cong',
          title: 'Xây cổng',
          description: 'Thi công cổng và hàng rào',
          status: 'todo',
          images: [],
          deadline: '2025-06-19',
          estimatedDays: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          order: 6
        },
        {
          id: 'b7-dien',
          title: 'Lắp điện',
          description: 'Thi công hệ thống điện chính',
          status: 'in_progress',
          images: [],
          deadline: '2025-06-30',
          estimatedDays: 13,
          startDate: '2025-06-17',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 7
        },
        {
          id: 'b8-nuoc',
          title: 'Lắp nước',
          description: 'Hệ thống nước và xử lý nước',
          status: 'todo',
          images: [],
          deadline: '2025-07-10',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 8
        }
      ]
    }
  ]
}
