import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import Button from '../components/ui/Button'
import { Role } from '../types'

interface LoginProps {
  onSuccess: (message: string) => void
}

export default function Login({ onSuccess }: LoginProps) {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const description = useMemo(
    () => 'Chọn vai trò và đăng nhập bằng chế độ demo. Dữ liệu sẽ được lưu trên trình duyệt của bạn.',
    []
  )

  const handleLogin = (role: Role) => {
    const userName = name.trim() || (role === 'manager' ? 'Quản lý Demo' : 'Giám sát Demo')
    login({ id: `user-${role}`, name: userName, role })
    onSuccess(`Đăng nhập thành công với vai trò ${role === 'manager' ? 'Quản lý' : 'Giám sát'}`)
    navigate(role === 'manager' ? '/' : '/projects')
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col justify-center gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-brand-500">ConstructTrack</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">Đăng nhập demo</h1>
        <p className="mt-3 max-w-2xl text-slate-600">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xl font-semibold text-slate-900">Quản lý</p>
          <p className="mt-2 text-sm text-slate-600">Xem dashboard tổng quan, tạo và quản lý dự án.</p>
          <label className="mt-5 block text-sm font-medium text-slate-700">Tên của bạn</label>
          <input
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nhập tên (tùy chọn)"
          />
          <Button type="button" className="mt-6 w-full" onClick={() => handleLogin('manager')}>
            Đăng nhập Quản lý
          </Button>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xl font-semibold text-slate-900">Giám sát</p>
          <p className="mt-2 text-sm text-slate-600">Kéo thả công việc, cập nhật tiến độ và upload ảnh hiện trường.</p>
          <label className="mt-5 block text-sm font-medium text-slate-700">Tên của bạn</label>
          <input
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nhập tên (tùy chọn)"
          />
          <Button type="button" className="mt-6 w-full" onClick={() => handleLogin('supervisor')}>
            Đăng nhập Giám sát
          </Button>
        </div>
      </div>
    </div>
  )
}
