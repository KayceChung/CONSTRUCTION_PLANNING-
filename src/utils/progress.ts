import { Project, Task } from '../types'

export function getTaskWeight(totalTasks: number): number {
  if (totalTasks === 0) return 0
  return parseFloat((100 / totalTasks).toFixed(2))
}

export function calcProjectProgress(tasks: Task[]): number {
  const activeTasks = tasks.filter((task) => task.status !== 'cancelled')
  if (activeTasks.length === 0) return 0
  const doneCount = activeTasks.filter((task) => task.status === 'done').length
  return Math.round((doneCount / activeTasks.length) * 100)
}

export function calculateProjectProgress(project: Project): number {
  return calcProjectProgress(project.tasks)
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
