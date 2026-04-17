import { create } from 'zustand'
import { Project, Task, TaskStatus, User } from '../types'
import { createSeedProjects, loadProjects, saveProjects } from '../utils/storage'

interface ProjectState {
  projects: Project[]
  initProjects: () => void
  addProject: (project: Project) => void
  updateProject: (projectId: string, changes: Partial<Project>) => void
  deleteProject: (projectId: string) => void
  addTask: (projectId: string, task: Task) => void
  updateTask: (projectId: string, taskId: string, changes: Partial<Task>) => void
  deleteTask: (projectId: string, taskId: string) => void
  assignProjects: (user: User) => Project[]
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  initProjects: () => {
    const saved = loadProjects()
    const projects = saved.length > 0 ? saved : createSeedProjects()
    saveProjects(projects)
    set({ projects })
  },
  addProject: (project) => {
    const next = [...get().projects, project]
    saveProjects(next)
    set({ projects: next })
  },
  updateProject: (projectId, changes) => {
    const next = get().projects.map((project) =>
      project.id === projectId ? { ...project, ...changes } : project
    )
    saveProjects(next)
    set({ projects: next })
  },
  deleteProject: (projectId) => {
    const next = get().projects.filter((project) => project.id !== projectId)
    saveProjects(next)
    set({ projects: next })
  },
  addTask: (projectId, task) => {
    const next = get().projects.map((project) =>
      project.id === projectId ? { ...project, tasks: [...project.tasks, task] } : project
    )
    saveProjects(next)
    set({ projects: next })
  },
  updateTask: (projectId, taskId, changes) => {
    const next = get().projects.map((project) => {
      if (project.id !== projectId) return project
      const tasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, ...changes, updatedAt: new Date().toISOString() } : task
      )
      return { ...project, tasks }
    })
    saveProjects(next)
    set({ projects: next })
  },
  deleteTask: (projectId, taskId) => {
    const next = get().projects.map((project) =>
      project.id === projectId
        ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }
        : project
    )
    saveProjects(next)
    set({ projects: next })
  },
  assignProjects: (user) => {
    if (user.role === 'manager') return get().projects
    return get().projects.filter((project) => project.tasks.some((task) => task.status !== 'cancelled'))
  }
}))
