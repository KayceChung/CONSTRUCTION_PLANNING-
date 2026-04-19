import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { ProjectType, TaskTemplate } from '../types'
import { loadProjectTypes, saveProjectTypes, loadTaskTemplates, saveTaskTemplates } from '../utils/storage'

interface ProjectTypeStore {
  projectTypes: ProjectType[]
  taskTemplates: TaskTemplate[]
  loading: boolean
  initProjectTypes: () => Promise<void>
  addProjectType: (projectType: Omit<ProjectType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProjectType: (id: string, updates: Partial<ProjectType>) => Promise<void>
  deleteProjectType: (id: string) => Promise<void>
  addTaskTemplate: (taskTemplate: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTaskTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<void>
  deleteTaskTemplate: (id: string) => Promise<void>
  getTaskTemplatesByProjectType: (projectTypeId: string) => TaskTemplate[]
  getDefaultTaskTemplates: (projectTypeId: string) => TaskTemplate[]
}

export const useProjectTypeStore = create<ProjectTypeStore>((set, get) => ({
  projectTypes: [],
  taskTemplates: [],
  loading: false,

  initProjectTypes: async () => {
    try {
      set({ loading: true })
      const [projectTypes, taskTemplates] = await Promise.all([
        loadProjectTypes(),
        loadTaskTemplates()
      ])
      set({ projectTypes, taskTemplates, loading: false })
    } catch (error) {
      console.error('Error loading project types:', error)
      set({ loading: false })
    }
  },

  addProjectType: async (projectType) => {
    const newProjectType: ProjectType = {
      ...projectType,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const next = [...get().projectTypes, newProjectType]
    await saveProjectTypes(next)
    set({ projectTypes: next })
  },

  updateProjectType: async (id, updates) => {
    const next = get().projectTypes.map((pt) =>
      pt.id === id
        ? { ...pt, ...updates, updatedAt: new Date().toISOString() }
        : pt
    )
    await saveProjectTypes(next)
    set({ projectTypes: next })
  },

  deleteProjectType: async (id) => {
    const nextProjectTypes = get().projectTypes.filter((pt) => pt.id !== id)
    const nextTaskTemplates = get().taskTemplates.filter((tt) => tt.projectTypeId !== id)
    await Promise.all([
      saveProjectTypes(nextProjectTypes),
      saveTaskTemplates(nextTaskTemplates)
    ])
    set({ projectTypes: nextProjectTypes, taskTemplates: nextTaskTemplates })
  },

  addTaskTemplate: async (taskTemplate) => {
    const newTaskTemplate: TaskTemplate = {
      ...taskTemplate,
      estimatedDays: taskTemplate.estimatedDays ?? 0,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const next = [...get().taskTemplates, newTaskTemplate]
    await saveTaskTemplates(next)
    set({ taskTemplates: next })
  },

  updateTaskTemplate: async (id, updates) => {
    const next = get().taskTemplates.map((tt) =>
      tt.id === id
        ? { ...tt, ...updates, updatedAt: new Date().toISOString() }
        : tt
    )
    await saveTaskTemplates(next)
    set({ taskTemplates: next })
  },

  deleteTaskTemplate: async (id) => {
    const next = get().taskTemplates.filter((tt) => tt.id !== id)
    await saveTaskTemplates(next)
    set({ taskTemplates: next })
  },

  getTaskTemplatesByProjectType: (projectTypeId) => {
    return get().taskTemplates
      .filter((tt) => tt.projectTypeId === projectTypeId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  },

  getDefaultTaskTemplates: (projectTypeId) => {
    return get().taskTemplates
      .filter((tt) => tt.projectTypeId === projectTypeId && tt.isDefault)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }
}))
