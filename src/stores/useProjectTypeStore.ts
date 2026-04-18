import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProjectType, TaskTemplate } from '../types'

interface ProjectTypeStore {
  projectTypes: ProjectType[]
  taskTemplates: TaskTemplate[]
  addProjectType: (projectType: Omit<ProjectType, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProjectType: (id: string, updates: Partial<ProjectType>) => void
  deleteProjectType: (id: string) => void
  addTaskTemplate: (taskTemplate: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTaskTemplate: (id: string, updates: Partial<TaskTemplate>) => void
  deleteTaskTemplate: (id: string) => void
  getTaskTemplatesByProjectType: (projectTypeId: string) => TaskTemplate[]
  getDefaultTaskTemplates: (projectTypeId: string) => TaskTemplate[]
}

const initialProjectTypes: ProjectType[] = [
  {
    id: '1',
    name: 'Xây dựng nhà phố',
    color: '#3B82F6',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Xây dựng biệt thự',
    color: '#10B981',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Sửa chữa nhà cửa',
    color: '#F59E0B',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Nội thất',
    color: '#8B5CF6',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const initialTaskTemplates: TaskTemplate[] = [
  // Xây dựng nhà phố
  {
    id: '1',
    projectTypeId: '1',
    title: 'Khảo sát hiện trạng',
    sortOrder: 1,
    isDefault: true,
    estimatedDays: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    projectTypeId: '1',
    title: 'Thiết kế kiến trúc',
    sortOrder: 2,
    isDefault: true,
    estimatedDays: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    projectTypeId: '1',
    title: 'Xin giấy phép xây dựng',
    sortOrder: 3,
    isDefault: true,
    estimatedDays: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    projectTypeId: '1',
    title: 'Đào móng',
    sortOrder: 4,
    isDefault: true,
    estimatedDays: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    projectTypeId: '1',
    title: 'Xây dựng móng',
    sortOrder: 5,
    isDefault: true,
    estimatedDays: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    projectTypeId: '1',
    title: 'Xây dựng khung nhà',
    sortOrder: 6,
    isDefault: true,
    estimatedDays: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    projectTypeId: '1',
    title: 'Hoàn thiện nội ngoại thất',
    sortOrder: 7,
    isDefault: true,
    estimatedDays: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    projectTypeId: '1',
    title: 'Bàn giao công trình',
    sortOrder: 8,
    isDefault: true,
    estimatedDays: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Xây dựng biệt thự
  {
    id: '9',
    projectTypeId: '2',
    title: 'Khảo sát địa hình',
    sortOrder: 1,
    isDefault: true,
    estimatedDays: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '10',
    projectTypeId: '2',
    title: 'Thiết kế biệt thự',
    sortOrder: 2,
    isDefault: true,
    estimatedDays: 21,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '11',
    projectTypeId: '2',
    title: 'Xin giấy phép xây dựng',
    sortOrder: 3,
    isDefault: true,
    estimatedDays: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '12',
    projectTypeId: '2',
    title: 'Đào móng biệt thự',
    sortOrder: 4,
    isDefault: true,
    estimatedDays: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '13',
    projectTypeId: '2',
    title: 'Xây dựng móng biệt thự',
    sortOrder: 5,
    isDefault: true,
    estimatedDays: 21,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '14',
    projectTypeId: '2',
    title: 'Xây dựng khung biệt thự',
    sortOrder: 6,
    isDefault: true,
    estimatedDays: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '15',
    projectTypeId: '2',
    title: 'Hoàn thiện biệt thự',
    sortOrder: 7,
    isDefault: true,
    estimatedDays: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '16',
    projectTypeId: '2',
    title: 'Bàn giao biệt thự',
    sortOrder: 8,
    isDefault: true,
    estimatedDays: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Sửa chữa nhà cửa
  {
    id: '17',
    projectTypeId: '3',
    title: 'Khảo sát hư hỏng',
    sortOrder: 1,
    isDefault: true,
    estimatedDays: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '18',
    projectTypeId: '3',
    title: 'Lập phương án sửa chữa',
    sortOrder: 2,
    isDefault: true,
    estimatedDays: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '19',
    projectTypeId: '3',
    title: 'Chuẩn bị vật liệu',
    sortOrder: 3,
    isDefault: true,
    estimatedDays: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '20',
    projectTypeId: '3',
    title: 'Thực hiện sửa chữa',
    sortOrder: 4,
    isDefault: true,
    estimatedDays: 21,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '21',
    projectTypeId: '3',
    title: 'Hoàn thiện',
    sortOrder: 5,
    isDefault: true,
    estimatedDays: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Nội thất
  {
    id: '22',
    projectTypeId: '4',
    title: 'Thiết kế nội thất',
    sortOrder: 1,
    isDefault: true,
    estimatedDays: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '23',
    projectTypeId: '4',
    title: 'Lên danh sách vật liệu',
    sortOrder: 2,
    isDefault: true,
    estimatedDays: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '24',
    projectTypeId: '4',
    title: 'Đặt mua vật liệu',
    sortOrder: 3,
    isDefault: true,
    estimatedDays: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '25',
    projectTypeId: '4',
    title: 'Lắp đặt nội thất',
    sortOrder: 4,
    isDefault: true,
    estimatedDays: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '26',
    projectTypeId: '4',
    title: 'Hoàn thiện nội thất',
    sortOrder: 5,
    isDefault: true,
    estimatedDays: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const useProjectTypeStore = create<ProjectTypeStore>()(
  persist(
    (set, get) => ({
      projectTypes: initialProjectTypes,
      taskTemplates: initialTaskTemplates,

      addProjectType: (projectType) => {
        const newProjectType: ProjectType = {
          ...projectType,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set((state) => ({
          projectTypes: [...state.projectTypes, newProjectType]
        }))
      },

      updateProjectType: (id, updates) => {
        set((state) => ({
          projectTypes: state.projectTypes.map((pt) =>
            pt.id === id
              ? { ...pt, ...updates, updatedAt: new Date().toISOString() }
              : pt
          )
        }))
      },

      deleteProjectType: (id) => {
        set((state) => ({
          projectTypes: state.projectTypes.filter((pt) => pt.id !== id),
          taskTemplates: state.taskTemplates.filter((tt) => tt.projectTypeId !== id)
        }))
      },

      addTaskTemplate: (taskTemplate) => {
        const newTaskTemplate: TaskTemplate = {
          ...taskTemplate,
          estimatedDays: taskTemplate.estimatedDays ?? 0,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set((state) => ({
          taskTemplates: [...state.taskTemplates, newTaskTemplate]
        }))
      },

      updateTaskTemplate: (id, updates) => {
        set((state) => ({
          taskTemplates: state.taskTemplates.map((tt) =>
            tt.id === id
              ? { ...tt, ...updates, updatedAt: new Date().toISOString() }
              : tt
          )
        }))
      },

      deleteTaskTemplate: (id) => {
        set((state) => ({
          taskTemplates: state.taskTemplates.filter((tt) => tt.id !== id)
        }))
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
    }),
    {
      name: 'project-type-store'
    }
  )
)