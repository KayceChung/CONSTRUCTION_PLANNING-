import { Project } from '../types'

export function calculateProjectProgress(project: Project): number {
  return project.tasks.reduce((sum, task) => sum + (task.status === 'done' ? task.weight : 0), 0)
}

export function progressColor(value: number): string {
  if (value <= 30) return 'from-red-500 via-orange-400 to-yellow-400'
  if (value <= 70) return 'from-amber-500 via-yellow-400 to-lime-500'
  return 'from-emerald-500 via-teal-400 to-sky-500'
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
