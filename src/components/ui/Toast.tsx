import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

const toastColor: Record<NonNullable<ToastProps['type']>, string> = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  info: 'bg-slate-800'
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200)
    return () => window.clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm text-white shadow-xl ${toastColor[type]}`}>
      {message}
    </div>
  )
}
