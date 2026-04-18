import { Link, useLocation } from 'react-router-dom'
import { User } from '../../types'
import { Home, LayoutGrid, LogOut, ListChecks } from 'lucide-react'
import Button from '../ui/Button'

interface SidebarProps {
  user: User
  onLogout: () => void
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const navItems = [
    { label: 'Tổng quan', to: '/', icon: Home },
    { label: 'Dự án', to: '/projects', icon: LayoutGrid }
  ]

  if (user.role === 'manager') {
    navItems.push({ label: 'Khách hàng', to: '/customers', icon: ListChecks })
  }

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-6 border-r border-slate-200 bg-white px-6 py-6 lg:flex">
      <div>
        <div className="mb-8 inline-flex items-center gap-3 text-2xl font-semibold text-brand-900">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100">C</span>
          ConstructTrack
        </div>
        <div className="space-y-1 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Xin chào, {user.name}</p>
          <p>Vai trò: {user.role === 'manager' ? 'Quản lý' : 'Giám sát'}</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active ? 'bg-brand-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">Thông tin tài khoản</p>
          <p>{user.name}</p>
          <p className="mt-1 text-xs text-slate-500">Dữ liệu demo lưu trên trình duyệt</p>
        </div>
        <Button type="button" variant="secondary" className="w-full justify-center" onClick={onLogout}>
          <LogOut size={16} className="mr-2" /> Đăng xuất
        </Button>
      </div>
    </aside>
  )
}
