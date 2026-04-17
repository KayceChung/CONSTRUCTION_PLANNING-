export type Role = 'manager' | 'supervisor'

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'adjustment'
  | 'pending'
  | 'cancelled'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  weight: number
  images: string[]
  completedAt?: string
  updatedAt: string
  createdAt: string
  updatedBy: string
  note?: string
  order: number
}

export interface Project {
  id: string
  name: string
  location: string
  client: string
  startDate: string
  endDate: string
  tasks: Task[]
  createdAt: string
  webhookUrl: string
}

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
}
