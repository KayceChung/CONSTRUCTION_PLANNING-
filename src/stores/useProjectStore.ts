import { create } from 'zustand'
import { Project, Task, TaskStatus, User } from '../types'
import { createProjectRecord, createTaskRecord, deleteProjectRecord, deleteTaskRecord, loadProjects, updateProjectRecord, updateTaskRecord } from '../utils/storage'

interface ProjectState {
  projects: Project[]
  loading: boolean
  initialized: boolean
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
  loading: false,
  initialized: false,
  initProjects: async () => {
    try {
      set({ loading: true })
      const projects = await loadProjects()
      set({ projects, loading: false, initialized: true })
    } catch (error) {
      console.error('Error initializing projects:', error)
      set({ loading: false, initialized: true })
    }
  },
  addProject: async (project) => {
    await createProjectRecord(project)
    const next = [...get().projects.filter((item) => item.id !== project.id), project]
    set({ projects: next })
  },
  updateProject: async (projectId, changes) => {
    await updateProjectRecord(projectId, changes)
    const next = get().projects.map((project) =>
      project.id === projectId ? { ...project, ...changes } : project
    )
    set({ projects: next })
  },
  deleteProject: async (projectId) => {
    await deleteProjectRecord(projectId)
    const next = get().projects.filter((project) => project.id !== projectId)
    set({ projects: next })
  },
  addTask: async (projectId, task) => {
    await createTaskRecord(projectId, task)
    const next = get().projects.map((project) =>
      project.id === projectId ? { ...project, tasks: [...project.tasks, task] } : project
    )
    set({ projects: next })
  },
  updateTask: async (projectId, taskId, changes) => {
    await updateTaskRecord(taskId, changes)
    const next = get().projects.map((project) => {
      if (project.id !== projectId) return project
      const tasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, ...changes, updatedAt: new Date().toISOString() } : task
      )
      return { ...project, tasks }
    })
    set({ projects: next })
  },
  deleteTask: async (projectId, taskId) => {
    await deleteTaskRecord(taskId)
    const next = get().projects.map((project) =>
      project.id === projectId
        ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }
        : project
    )
    set({ projects: next })
  },
  assignProjects: (user) => {
    if (user.role === 'manager') return get().projects
    return get().projects.filter((project) => project.tasks.some((task) => task.status !== 'cancelled'))
  }
}))
