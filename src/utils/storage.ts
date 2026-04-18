import { AuthSession, ChangeLog, ContactLog, Customer, Project, Staff, User } from '../types'

const STORAGE_KEY = 'constructtrack_data'
const SESSION_KEY = 'constructtrack_session'

export interface StoredData {
  projects: Project[]
  staff: Staff[]
  customers: Customer[]
  contactLogs: ContactLog[]
  changeLogs: ChangeLog[]
}

export function loadData(): StoredData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { projects: [], staff: [], customers: [], contactLogs: [], changeLogs: [] }

  try {
    const parsed = JSON.parse(raw) as StoredData
    return {
      projects: parsed.projects || [],
      staff: parsed.staff || [],
      customers: parsed.customers || [],
      contactLogs: parsed.contactLogs || [],
      changeLogs: parsed.changeLogs || []
    }
  } catch {
    return { projects: [], staff: [], customers: [], contactLogs: [], changeLogs: [] }
  }
}

export function saveData(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadProjects(): Project[] {
  return loadData().projects
}

export function saveProjects(projects: Project[]): void {
  saveData({
    ...loadData(),
    projects
  })
}

export function loadStaff(): Staff[] {
  return loadData().staff
}

export function saveStaff(staff: Staff[]): void {
  saveData({
    ...loadData(),
    staff
  })
}

export function loadCustomers(): Customer[] {
  return loadData().customers
}

export function saveCustomers(customers: Customer[]): void {
  saveData({
    ...loadData(),
    customers
  })
}

export function loadContactLogs(): ContactLog[] {
  return loadData().contactLogs
}

export function saveContactLogs(contactLogs: ContactLog[]): void {
  saveData({
    ...loadData(),
    contactLogs
  })
}

export function loadUser(): User | null {
  const session = loadSession()
  if (!session) return null
  return {
    id: session.userId,
    name: session.name,
    role: session.role
  }
}

export function saveUser(user: User | null): void {
  if (!user) {
    saveSession(null)
    return
  }

  saveSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    loginAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString()
  })
}

export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (new Date(parsed.expiresAt) <= new Date()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function createSeedStaff(): Staff[] {
  return [
    {
      id: 'staff-manager',
      name: 'Trần Quản Lý',
      phone: '0909123456',
      email: 'quanly@demo.vn',
      role: 'manager',
      assignedProjects: ['proj-q7', 'proj-bd'],
      avatar: 'TQ',
      pinHash: btoa('1234' + 'staff-manager'),
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'staff-nga',
      name: 'Nguyễn Giám Sát',
      phone: '0912345678',
      email: 'giasat@demo.vn',
      role: 'supervisor',
      assignedProjects: ['proj-q7'],
      avatar: 'NG',
      pinHash: btoa('5678' + 'staff-nga'),
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'staff-hoa',
      name: 'Lê Thị Hoa',
      phone: '0987654321',
      email: 'lehoa@demo.vn',
      role: 'supervisor',
      assignedProjects: ['proj-bd'],
      avatar: 'LH',
      pinHash: btoa('9999' + 'staff-hoa'),
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]
}

export function createSeedCustomers(): Customer[] {
  return [
    {
      id: 'cust-an',
      fullName: 'Nguyễn Văn An',
      phone: '0901111222',
      email: 'an.q7@example.com',
      address: 'Quận 7, TP. HCM',
      note: 'Khách hàng quen, ưu tiên báo cáo qua Zalo',
      createdAt: new Date().toISOString(),
      projectIds: ['proj-q7']
    },
    {
      id: 'cust-binh',
      fullName: 'Trần Thị Bình',
      phone: '0912333444',
      email: 'binh.bd@example.com',
      address: 'Bình Dương',
      note: 'Khách cần báo cáo tiến độ 2 tuần/lần',
      createdAt: new Date().toISOString(),
      projectIds: ['proj-bd']
    },
    {
      id: 'cust-cuong',
      fullName: 'Lê Hoàng Cường',
      phone: '0923555666',
      address: 'Quận 2, TP. HCM',
      createdAt: new Date().toISOString(),
      projectIds: []
    }
  ]
}

export function createSeedContactLogs(): ContactLog[] {
  return [
    {
      id: 'log-1',
      customerId: 'cust-an',
      date: '2025-01-15',
      method: 'phone',
      content: 'Gọi trao đổi tiến độ và xác nhận bản vẽ thi công.',
      createdBy: 'Trần Quản Lý',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-2',
      customerId: 'cust-an',
      date: '2025-03-08',
      method: 'zalo',
      content: 'Gửi hình ảnh tiến độ phần móng và xin phản hồi.',
      createdBy: 'Nguyễn Giám Sát',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-3',
      customerId: 'cust-an',
      date: '2025-04-22',
      method: 'meeting',
      content: 'Đón khách tại công trường và thảo luận tổng kết thi công.',
      createdBy: 'Lê Thị Hoa',
      createdAt: new Date().toISOString()
    }
  ]
}

export function createSeedProjects(): Project[] {
  return [
    {
      id: 'proj-q7',
      name: 'Nhà phố 3 tầng - Q7 TPHCM',
      location: 'Quận 7, TP. HCM',
      client: 'Công ty Xây Dựng ABC',
      customerId: 'cust-an',
      category: 'new_construction',
      categoryNote: undefined,
      address: {
        fullAddress: '123 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7',
        ward: 'Phường Tân Hưng',
        district: 'Quận 7',
        province: 'TP. HCM',
        googleMapsUrl: ''
      },
      contractValue: 1500000000,
      paidAmount: 450000000,
      paymentNote: 'Đợt 1 - 30% khi ký HĐ',
      attachments: [],
      distanceKm: 18,
      startDate: '2025-05-01',
      endDate: '2025-11-15',
      createdAt: new Date().toISOString(),
      webhookUrl: 'https://yi7a1c8g.rpcld.co/webhook/00b8a546-422b-4786-ad00-0105bb20c435',
      assignedStaff: ['staff-manager', 'staff-nga'],
      tasks: [
        {
          id: 't1-mong',
          title: 'Đổ móng',
          description: 'Hoàn thành phần móng và cốt thép',
          status: 'done',
          images: [],
          deadline: '2025-05-16',
          estimatedDays: 15,
          startDate: '2025-05-01',
          completedAt: '2025-05-16',
          actualDays: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 1
        },
        {
          id: 't2-tuong1',
          title: 'Xây tường tầng 1',
          description: 'Xây dựng phần tường tầng 1',
          status: 'done',
          images: [],
          deadline: '2025-05-29',
          estimatedDays: 12,
          startDate: '2025-05-17',
          completedAt: '2025-05-29',
          actualDays: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 2
        },
        {
          id: 't3-tuong2',
          title: 'Xây tường tầng 2',
          description: 'Thi công phần tường tầng 2',
          status: 'in_progress',
          images: [],
          deadline: '2025-06-11',
          estimatedDays: 12,
          startDate: '2025-05-30',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 3
        },
        {
          id: 't4-tuong3',
          title: 'Xây tường tầng 3',
          description: 'Hoàn thiện khung và tường tầng 3',
          status: 'todo',
          images: [],
          deadline: '2025-06-22',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 4
        },
        {
          id: 't5-mai',
          title: 'Lợp mái',
          description: 'Thi công hệ mái và chống thấm',
          status: 'todo',
          images: [],
          deadline: '2025-07-02',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 5
        },
        {
          id: 't6-dien',
          title: 'Lắp điện',
          description: 'Hoàn thiện phần điện nước',
          status: 'pending',
          images: [],
          deadline: '2025-07-14',
          estimatedDays: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          order: 6
        },
        {
          id: 't7-nuoc',
          title: 'Lắp nước',
          description: 'Thi công hệ thống nước sinh hoạt',
          status: 'todo',
          images: [],
          deadline: '2025-07-24',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          order: 7
        },
        {
          id: 't8-son',
          title: 'Sơn hoàn thiện',
          description: 'Sơn nội thất và ngoại thất',
          status: 'todo',
          images: [],
          deadline: '2025-08-03',
          estimatedDays: 7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 8
        },
        {
          id: 't9-hoanthien',
          title: 'Hoàn thiện nội thất',
          description: 'Lắp đặt đồ nội thất và hoàn thiện cuối cùng',
          status: 'todo',
          images: [],
          deadline: '2025-08-15',
          estimatedDays: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 9
        }
      ]
    },
    {
      id: 'proj-bd',
      name: 'Biệt thự - Bình Dương',
      location: 'Bình Dương',
      client: 'Chủ đầu tư K',
      customerId: 'cust-binh',
      category: 'renovation',
      address: {
        fullAddress: 'Số 7, Khu đô thị Mỹ Phước, Bình Dương',
        ward: 'Phường Mỹ Phước',
        district: 'Thị xã Bến Cát',
        province: 'Bình Dương',
        googleMapsUrl: ''
      },
      contractValue: 2800000000,
      paidAmount: 1200000000,
      paymentNote: 'Đã thanh toán 40% ban đầu',
      attachments: [],
      distanceKm: 45,
      startDate: '2025-04-10',
      endDate: '2025-12-05',
      createdAt: new Date().toISOString(),
      webhookUrl: '',
      assignedStaff: ['staff-manager', 'staff-hoa'],
      tasks: [
        {
          id: 'b1-mong',
          title: 'Đổ móng',
          description: 'Thi công phần móng, ép cọc',
          status: 'done',
          images: [],
          deadline: '2025-04-25',
          estimatedDays: 15,
          startDate: '2025-04-10',
          completedAt: '2025-04-25',
          actualDays: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 1
        },
        {
          id: 'b2-tuong1',
          title: 'Xây tường tầng 1',
          description: 'Thi công tường tầng 1',
          status: 'done',
          images: [],
          deadline: '2025-05-06',
          estimatedDays: 12,
          startDate: '2025-04-25',
          completedAt: '2025-05-07',
          actualDays: 13,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Trần Quản Lý',
          order: 2
        },
        {
          id: 'b3-tuong2',
          title: 'Xây tường tầng 2',
          description: 'Thi công phần tường tầng 2',
          status: 'in_progress',
          images: [],
          deadline: '2025-05-20',
          estimatedDays: 12,
          startDate: '2025-05-08',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 3
        },
        {
          id: 'b4-ho-boi',
          title: 'Xây hồ bơi',
          description: 'Thi công hồ bơi và chống thấm',
          status: 'todo',
          images: [],
          deadline: '2025-06-01',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 4
        },
        {
          id: 'b5-san-vuon',
          title: 'Hoàn thiện sân vườn',
          description: 'Thi công sân vườn và cảnh quan',
          status: 'adjustment',
          images: [],
          deadline: '2025-06-11',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          note: 'Cần điều chỉnh vị trí cây xanh',
          order: 5
        },
        {
          id: 'b6-cong',
          title: 'Xây cổng',
          description: 'Thi công cổng và hàng rào',
          status: 'todo',
          images: [],
          deadline: '2025-06-19',
          estimatedDays: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Lê Thị Hoa',
          order: 6
        },
        {
          id: 'b7-dien',
          title: 'Lắp điện',
          description: 'Thi công hệ thống điện chính',
          status: 'in_progress',
          images: [],
          deadline: '2025-06-30',
          estimatedDays: 13,
          startDate: '2025-06-17',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Giám Sát',
          order: 7
        },
        {
          id: 'b8-nuoc',
          title: 'Lắp nước',
          description: 'Hệ thống nước và xử lý nước',
          status: 'todo',
          images: [],
          deadline: '2025-07-10',
          estimatedDays: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Nguyễn Văn An',
          order: 8
        }
      ]
    }
  ]
}
