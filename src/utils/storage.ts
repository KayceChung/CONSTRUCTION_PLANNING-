import { Project, User } from '../types'

const STORAGE_KEY = 'constructtrack_data'
const USER_KEY = 'constructtrack_user'

export interface StoredData {
  projects: Project[]
}

export function loadProjects(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as StoredData
    return parsed.projects || []
  } catch {
    return []
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects }))
}

export function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function saveUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(USER_KEY)
    return
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function createSeedProjects(): Project[] {
  return [
    {
      id: 'proj-q7',
      name: 'Nhà phố 3 tầng - Q7 TPHCM',
      location: 'Quận 7, TP. HCM',
      client: 'Công ty Xây Dựng ABC',
      startDate: '2025-05-01',
      endDate: '2025-11-15',
      createdAt: new Date().toISOString(),
      webhookUrl: '',
      tasks: [
        {
          id: 't1-mong',
          title: 'Đổ móng',
          description: 'Hoàn thành phần móng và cốt thép',
          status: 'done',
          weight: 15,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 1
        },
        {
          id: 't2-tuong1',
          title: 'Xây tường tầng 1',
          description: 'Xây dựng phần tường tầng 1',
          status: 'done',
          weight: 12,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 2
        },
        {
          id: 't3-tuong2',
          title: 'Xây tường tầng 2',
          description: 'Thi công phần tường tầng 2',
          status: 'in_progress',
          weight: 12,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Bình',
          order: 3
        },
        {
          id: 't4-tuong3',
          title: 'Xây tường tầng 3',
          description: 'Hoàn thiện khung và tường tầng 3',
          status: 'todo',
          weight: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Bình',
          order: 4
        },
        {
          id: 't5-mai',
          title: 'Lợp mái',
          description: 'Thi công hệ mái và chống thấm',
          status: 'todo',
          weight: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 5
        },
        {
          id: 't6-dien',
          title: 'Lắp điện',
          description: 'Hoàn thiện phần điện nước',
          status: 'pending',
          weight: 12,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Phạm Thị Cẩm',
          order: 6
        },
        {
          id: 't7-nuoc',
          title: 'Lắp nước',
          description: 'Thi công hệ thống nước sinh hoạt',
          status: 'todo',
          weight: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Phạm Thị Cẩm',
          order: 7
        },
        {
          id: 't8-sơn',
          title: 'Sơn hoàn thiện',
          description: 'Sơn nội thất và ngoại thất',
          status: 'todo',
          weight: 7,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Bình',
          order: 8
        },
        {
          id: 't9-hoanthien',
          title: 'Hoàn thiện nội thất',
          description: 'Lắp đặt đồ nội thất và hoàn thiện cuối cùng',
          status: 'todo',
          weight: 12,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 9
        }
      ]
    },
    {
      id: 'proj-bd',
      name: 'Biệt thự - Bình Dương',
      location: 'Bình Dương',
      client: 'Chủ đầu tư K',
      startDate: '2025-04-10',
      endDate: '2025-12-05',
      createdAt: new Date().toISOString(),
      webhookUrl: '',
      tasks: [
        {
          id: 'b1-mong',
          title: 'Đổ móng',
          description: 'Thi công phần móng, ép cọc',
          status: 'done',
          weight: 15,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 1
        },
        {
          id: 'b2-tuong1',
          title: 'Xây tường tầng 1',
          description: 'Thi công tường tầng 1',
          status: 'done',
          weight: 12,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 2
        },
        {
          id: 'b3-tuong2',
          title: 'Xây tường tầng 2',
          description: 'Thi công phần tường tầng 2',
          status: 'in_progress',
          weight: 12,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Bình',
          order: 3
        },
        {
          id: 'b4-ho-boi',
          title: 'Xây hồ bơi',
          description: 'Thi công hồ bơi và chống thấm',
          status: 'todo',
          weight: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Bình',
          order: 4
        },
        {
          id: 'b5-san-vuon',
          title: 'Hoàn thiện sân vườn',
          description: 'Thi công sân vườn và cảnh quan',
          status: 'adjustment',
          weight: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Phạm Thị Cẩm',
          note: 'Cần điều chỉnh vị trí cây xanh',
          order: 5
        },
        {
          id: 'b6-cong',
          title: 'Xây cổng',
          description: 'Thi công cổng và hàng rào',
          status: 'todo',
          weight: 8,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Phạm Thị Cẩm',
          order: 6
        },
        {
          id: 'b7-dien',
          title: 'Lắp điện',
          description: 'Thi công hệ thống điện chính',
          status: 'in_progress',
          weight: 13,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Bình',
          order: 7
        },
        {
          id: 'b8-nuoc',
          title: 'Lắp nước',
          description: 'Hệ thống nước và xử lý nước',
          status: 'todo',
          weight: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 8
        }
      ]
    }
  ]
}
