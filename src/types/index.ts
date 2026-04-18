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
  note?: string
  createdAt: string
  projectIds: string[]
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
}

export interface Staff {
  id: string
  name: string
  phone: string
  email?: string
  role: Role
  assignedProjects: string[]
  avatar?: string
  pinHash: string
  isActive: boolean
  createdAt: string
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
