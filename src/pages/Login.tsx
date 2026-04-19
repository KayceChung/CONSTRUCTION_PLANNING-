import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabase'

interface LoginProps {
  onSuccess: (message: string) => void
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    const signupMessage = (location.state as { signupMessage?: string } | null)?.signupMessage
    if (signupMessage) {
      setBanner(signupMessage)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const handleLogin = async () => {
    if (!email || !password) return

    setLoading(true)
    try {
      await login(email, password)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Không lấy được thông tin tài khoản sau khi đăng nhập.')
      }

      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, is_active')
        .eq('id', user.id)
        .maybeSingle()

      if (staffError) {
        throw staffError
      }

      if (!staff) {
        await supabase.auth.signOut()
        throw new Error('Tài khoản đã xác thực nhưng chưa có hồ sơ nhân sự trong hệ thống.')
      }

      if (!staff.is_active) {
        await supabase.auth.signOut()
        throw new Error('Tài khoản chưa được quản lý duyệt.')
      }

      onSuccess('Đăng nhập thành công')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      const errMsg = error instanceof Error ? error.message : 'Đăng nhập thất bại'
      alert(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-brand-500">ConstructTrack</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">Đăng nhập</h1>
        <p className="mt-3 text-slate-600">Đăng nhập vào tài khoản của bạn</p>
        {banner ? <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{banner}</div> : null}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Nhập email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
          <input
            type="password"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
          />
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </div>
      <div className="flex flex-col items-center gap-2 mt-8">
        <button
          type="button"
          className="text-blue-700 font-semibold hover:underline transition"
          onClick={() => navigate('/signup')}
        >
          + Tạo tài khoản mới
        </button>
        <button
          type="button"
          className="text-slate-500 hover:text-blue-600 hover:underline text-sm transition"
          onClick={() => navigate('/forgot-password')}
        >
          Quên mật khẩu?
        </button>
      </div>
    </div>
  )
}
