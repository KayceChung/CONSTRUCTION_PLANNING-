export type Role = 'manager' | 'supervisor'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'adjustment' | 'pending' | 'cancelled'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  images: string[]
  deadline: string
  estimatedDays: number | null
  startDate?: string
  completedAt?: string
  actualDays?: number | null
  updatedAt: string
  createdAt: string
  updatedBy: string
  note?: string
  order: number
  fromTemplateId?: string | null // Thêm field này
  assignee?: string // Người phụ trách
  taskDeadline?: string // Deadline riêng của task (khác với deadline chung)
}

export type ProjectCategory = 'new_construction' | 'renovation' | 'other'

export interface ProjectAddress {
  fullAddress: string
  ward?: string
  district?: string
  province?: string
  googleMapsUrl?: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'pdf' | 'other'
  size: number
  uploadedAt: string
}

export interface Customer {
  id: string
  fullName: string
  phone: string
  phone2?: string
  email?: string
  address?: string
  source?: string                     // kênh biết đến: giới thiệu, facebook, zalo, khác
  status?: 'lead' | 'nurturing' | 'contracted' | 'inactive'  // trạng thái trong pipeline
  note?: string
  notes?: string
  zaloThreadId?: string               // thread ID cá nhân trên Zalo
  createdAt: string
  updatedAt?: string
  projectIds: string[]
}

export interface InteractionLog {
  id: string
  customerId: string
  type: 'call' | 'meet' | 'zalo' | 'email' | 'note' | 'site_visit'
  date: string                        // ngày ghi nhận (YYYY-MM-DD)
  time?: string                       // giờ (HH:mm)
  summary: string                     // nội dung trao đổi
  nextAction?: string                 // việc cần làm tiếp theo
  nextActionDate?: string             // deadline việc tiếp theo (YYYY-MM-DD)
  createdBy: string
  createdAt: string
}

export interface ContactLog {
  id: string
  customerId: string
  date: string
  method: 'phone' | 'zalo' | 'meeting' | 'email'
  content: string
  createdBy: string
  createdAt: string
}

export interface ProjectType {
  id: string
  name: string
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TaskTemplate {
  id: string
  projectTypeId: string
  title: string
  sortOrder: number
  isDefault: boolean
  estimatedDays: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  location: string
  client: string
  customerId: string
  category: ProjectCategory
  categoryNote?: string
  address: ProjectAddress
  contractValue: number
  paidAmount: number
  paymentNote?: string
  attachments: Attachment[]
  distanceKm?: number
  startDate: string
  endDate: string
  tasks: Task[]
  createdAt: string
  webhookUrl: string
  assignedStaff: string[]
  projectTypeId?: string | null
  notes?: string // Ghi chú dự án

  // Zalo integration fields
  zaloGroupThreadId?: string // Thread ID của group Zalo
  zaloGroupName?: string // Tên group Zalo
  zaloLinkedAt?: string // ISO datetime khi kết nối Zalo
  zaloStatus?: 'linked' | 'pending' | 'failed' | null // Trạng thái kết nối
}

export interface Staff {
  id: string
  name: string
  phone: string
  email?: string
  role: Role
  assignedProjects: string[]
  avatar?: string
  pinHash?: string
  isActive: boolean
  createdAt: string
}

export type PersonnelStatus = 'pending' | 'active' | 'paused' | 'former' | 'rejected'

export interface PersonnelRoleChange {
  id: string
  changedAt: string
  oldPosition: string
  newPosition: string
  changedBy: string
}

export interface Personnel {
  id: string
  fullName: string
  phone: string
  position: string
  startDate?: string
  payRate?: string
  notes?: string
  projectIds: string[]
  status: PersonnelStatus
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  roleChanges: PersonnelRoleChange[]
}

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
}

export interface AuthSession {
  userId: string
  name: string
  role: Role
  loginAt: string
  expiresAt: string
}

export interface ChangeLog {
  id: string
  taskId: string
  taskTitle: string
  projectId: string
  projectName: string
  userId: string
  userName: string
  userRole: Role
  previousStatus: TaskStatus | null
  newStatus: TaskStatus
  note: string
  images: string[]
  createdAt: string
}
