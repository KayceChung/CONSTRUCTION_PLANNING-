import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import { useAuthStore } from '../stores/useAuthStore'

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

export default function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate form
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setMessage('Vui lòng điền đầy đủ thông tin')
      setMessageType('error')
      return
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp')
      setMessageType('error')
      return
    }

    if (form.password.length < 6) {
      setMessage('Mật khẩu phải có ít nhất 6 ký tự')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (user) {
        await supabase.auth.signOut()
      }

      // 1. Tạo user trong Supabase Auth
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
              phone: form.phone,
            },
          },
        }),
        15000,
        'Đăng ký đang mất quá lâu. Vui lòng kiểm tra kết nối hoặc thử lại.'
      )

      if (error) {
        setMessage(error.message)
        setMessageType('error')
        return
      }

      if (!data.user) {
        setMessage('Không thể tạo tài khoản. Vui lòng thử lại.')
        setMessageType('error')
        return
      }

      // 2. Ghi staff nếu signup trả về session dùng được.
      // Trong nhiều cấu hình Supabase, staff sẽ được tạo bằng trigger DB từ auth.users.
      if (data.session?.user) {
        const { error: staffError } = await withTimeout(
          supabase.from('staff').upsert([{
            id: data.user.id,
            name: form.name,
            phone: form.phone,
            email: form.email,
            role: 'supervisor',
            is_active: false
          }], { onConflict: 'id' }),
          15000,
          'Đã tạo tài khoản nhưng không thể ghi hồ sơ nhân sự đúng thời gian. Vui lòng thử lại.'
        )

        if (staffError) {
          setMessage(`${staffError.message}. Nếu auth.users đã có bản ghi nhưng staff chưa có, hãy áp dụng trigger tạo staff tự động trong file supabase_setup.sql.`)
          setMessageType('error')
          return
        }
      }

      await supabase.auth.signOut()
      navigate('/login', {
        replace: true,
        state: {
          signupMessage: 'Đăng ký thành công. Tài khoản đang chờ quản lý duyệt.',
        },
      })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Lỗi không xác định')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-brand-500">ConstructTrack</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">Tạo tài khoản</h1>
        <p className="mt-3 text-slate-600">Đăng ký tài khoản mới để bắt đầu</p>
        {user ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Bạn đang đăng nhập bằng tài khoản hiện có. Khi tạo tài khoản mới, hệ thống sẽ đăng xuất phiên hiện tại trước khi đăng ký.
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Họ tên</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nhập họ tên"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Nhập email"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Số điện thoại</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Xác nhận mật khẩu</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        {message && (
          <div className={`rounded-lg p-3 text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Nếu `auth.users` có dữ liệu nhưng `staff` chưa có, nguyên nhân thường là policy/trigger ở Supabase. Frontend đã hỗ trợ fallback, nhưng cách ổn định nhất là bật trigger tự tạo staff trong SQL setup.
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-600">Đã có tài khoản?</p>
        <button
          type="button"
          className="font-semibold text-blue-700 hover:underline transition"
          onClick={() => navigate('/login')}
        >
          Đăng nhập
        </button>
      </div>
    </div>
  )
}
