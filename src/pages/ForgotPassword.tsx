import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email) {
      setMessage('Vui lòng nhập email')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư của bạn.')
        setMessageType('success')
        setTimeout(() => setEmail(''), 2000)
      }
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
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">Quên mật khẩu</h1>
        <p className="mt-3 text-slate-600">Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>
      </div>

      <form onSubmit={handleForgot} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>

        {message && (
          <div className={`rounded-lg p-3 text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lại mật khẩu'}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 border-t border-slate-200 pt-6">
        <button
          type="button"
          className="text-blue-700 font-semibold hover:underline transition"
          onClick={() => navigate('/login')}
        >
          ← Quay lại đăng nhập
        </button>
      </div>
    </div>
  )
}
