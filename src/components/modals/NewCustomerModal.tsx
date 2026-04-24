import { useState } from 'react'
import Button from '../ui/Button'

interface NewCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (customer: {
    fullName: string
    phone: string
    phone2?: string
    email?: string
    address?: string
    note?: string
  }) => void
}

export default function NewCustomerModal({ isOpen, onClose, onSubmit }: NewCustomerModalProps) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [phone2, setPhone2] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    if (!fullName || !phone) return
    onSubmit({
      fullName,
      phone,
      phone2: phone2 || undefined,
      email: email || undefined,
      address: address || undefined,
      note: note || undefined
    })
    setFullName('')
    setPhone('')
    setPhone2('')
    setEmail('')
    setAddress('')
    setNote('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-3 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-lg sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Tạo khách hàng mới</h2>
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Họ và tên *</label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Số điện thoại chính *</label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0901234567"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Số phụ / Zalo</label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              placeholder="VD: 0912345678"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Email</label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Địa chỉ</label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123/12 Nguyễn Văn Linh, Q7"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Ghi chú</label>
            <textarea
              className="mt-1 min-h-[80px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách thích báo cáo qua Zalo"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="min-h-[44px] w-full sm:w-auto" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" className="min-h-[44px] w-full sm:w-auto" onClick={handleSubmit} disabled={!fullName || !phone}>
            Tạo khách hàng
          </Button>
        </div>
      </div>
    </div>
  )
}