import { create } from 'zustand'
import { Project, Task, TaskStatus, User } from '../types'
import { loadProjects, saveProjects } from '../utils/storage'

interface ProjectState {
  projects: Project[]
  initProjects: () => Promise<void>
  addProject: (project: Project) => Promise<void>
  updateProject: (projectId: string, changes: Partial<Project>) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  addTask: (projectId: string, task: Task) => Promise<void>
  updateTask: (projectId: string, taskId: string, changes: Partial<Task>) => Promise<void>
  deleteTask: (projectId: string, taskId: string) => Promise<void>
  assignProjects: (user: User) => Project[]
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  initProjects: async () => {
    try {
      const projects = await loadProjects()
      set({ projects })
    } catch (error) {
      console.error('Error initializing projects:', error)
    }
  },
  addProject: async (project) => {
    const next = [...get().projects, project]
    await saveProjects(next)
    set({ projects: next })
  },
  updateProject: async (projectId, changes) => {
    const next = get().projects.map((project) =>
      project.id === projectId ? { ...project, ...changes } : project
    )
    await saveProjects(next)
    set({ projects: next })
  },
  deleteProject: async (projectId) => {
    const next = get().projects.filter((project) => project.id !== projectId)
    await saveProjects(next)
    set({ projects: next })
  },
  addTask: async (projectId, task) => {
    const next = get().projects.map((project) =>
      project.id === projectId ? { ...project, tasks: [...project.tasks, task] } : project
    )
    await saveProjects(next)
    set({ projects: next })
  },
  updateTask: async (projectId, taskId, changes) => {
    const next = get().projects.map((project) => {
      if (project.id !== projectId) return project
      const tasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, ...changes, updatedAt: new Date().toISOString() } : task
      )
      return { ...project, tasks }
    })
    await saveProjects(next)
    set({ projects: next })
  },
  deleteTask: async (projectId, taskId) => {
    const next = get().projects.map((project) =>
      project.id === projectId
        ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }
        : project
    )
    await saveProjects(next)
    set({ projects: next })
  },
  assignProjects: (user) => {
    if (user.role === 'manager') return get().projects
    return get().projects.filter((project) => project.tasks.some((task) => task.status !== 'cancelled'))
  }
}))
