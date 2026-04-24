import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User } from '../../types'
import { Home, LayoutGrid, LogOut, ListChecks, Settings, Users } from 'lucide-react'
import Button from '../ui/Button'
import { useStaffStore } from '../../stores/useStaffStore'

interface SidebarProps {
  user: User
  onLogout: () => void
}

interface NavItem {
  label: string
  to: string
  icon: typeof Home
  badge?: string
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [logoError, setLogoError] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const pendingCount = useStaffStore((state) => state.staff.filter((item) => !item.isActive).length)
  const logoUrl = `${(import.meta as any).env?.BASE_URL || '/'}logo.png`
  const navItems: NavItem[] = [
    { label: 'Tổng quan', to: '/', icon: Home },
    { label: 'Dự án', to: '/projects', icon: LayoutGrid }
  ]

  if (user.role === 'manager') {
    navItems.push({ label: 'Nhân sự', to: '/personnel', icon: Users, badge: pendingCount > 0 ? String(pendingCount) : undefined })
    navItems.push({ label: 'Khách hàng', to: '/customers', icon: ListChecks })
    navItems.push({ label: 'Cài đặt', to: '/settings', icon: Settings })
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await onLogout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <aside className="hidden h-screen w-80 shrink-0 flex-col border-r border-slate-200 bg-white px-6 py-6 lg:flex">
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div>
        <div className="mb-8 inline-flex items-center gap-3 text-2xl font-semibold text-blue-600">
          {!logoError ? (
            <img
              src={logoUrl}
              alt="ConstructTrack Logo"
              className="h-10 w-10 rounded-2xl object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-600">C</span>
          )}
          ConstructTrack
        </div>
        <div className="space-y-1 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Xin chào, {user.name}</p>
          <p>Vai trò: {user.role === 'manager' ? 'Quản lý' : 'Giám sát'}</p>
        </div>
        </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>{item.badge}</span> : null}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 pt-2">
        <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">Thông tin tài khoản</p>
          <p>{user.name}</p>
          <p className="mt-1 text-xs text-slate-500">Dữ liệu nhân sự và dự án đang đồng bộ theo Supabase</p>
        </div>
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full justify-center" 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut size={16} className="mr-2" /> 
          {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </Button>
      </div>
      </div>
    </aside>
  )
}
