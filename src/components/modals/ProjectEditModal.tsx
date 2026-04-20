import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import { Project } from '../../types'
import { provinces } from '../../constants/provinces'

interface ProjectEditModalProps {
  isOpen: boolean
  project: Project
  onClose: () => void
  onSave: (updates: Partial<Project>) => Promise<void>
}

export default function ProjectEditModal({ isOpen, project, onClose, onSave }: ProjectEditModalProps) {
  const [name, setName] = useState(project.name)
  const [fullAddress, setFullAddress] = useState(project.address.fullAddress || project.location)
  const [ward, setWard] = useState(project.address.ward || '')
  const [district, setDistrict] = useState(project.address.district || '')
  const [province, setProvince] = useState(project.address.province || 'TP. HCM')
  const [startDate, setStartDate] = useState(project.startDate)
  const [endDate, setEndDate] = useState(project.endDate)
  const [contractValue, setContractValue] = useState(String(project.contractValue || 0))
  const [paidAmount, setPaidAmount] = useState(String(project.paidAmount || 0))
  const [paymentNote, setPaymentNote] = useState(project.paymentNote || '')
  const [category, setCategory] = useState(project.category)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setFullAddress(project.address.fullAddress || project.location)
      setWard(project.address.ward || '')
      setDistrict(project.address.district || '')
      setProvince(project.address.province || 'TP. HCM')
      setStartDate(project.startDate)
      setEndDate(project.endDate)
      setContractValue(String(project.contractValue || 0))
      setPaidAmount(String(project.paidAmount || 0))
      setPaymentNote(project.paymentNote || '')
      setCategory(project.category)
    }
  }, [project])

  if (!isOpen) return null

  const handleSave = async () => {
    if (isSaving) return

    const contractValueNumber = Number(contractValue.replace(/[^0-9.-]/g, '')) || 0
    const paidAmountNumber = Number(paidAmount.replace(/[^0-9.-]/g, '')) || 0

    setIsSaving(true)
    try {
      await onSave({
        name,
        category,
        address: {
          ...project.address,
          fullAddress,
          ward: ward || undefined,
          district: district || undefined,
          province,
        },
        startDate,
        endDate,
        contractValue: contractValueNumber,
        paidAmount: paidAmountNumber,
        paymentNote: paymentNote || undefined,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Chỉnh sửa dự án</h2>
            <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin và thanh toán cho dự án hiện tại.</p>
          </div>
          <button type="button" className="text-slate-500 hover:text-slate-900" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Tên dự án</label>
              <input
                className="mt-2 w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Loại hình</label>
              <select
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                value={category}
                onChange={(e) => setCategory(e.target.value as Project['category'])}
              >
                <option value="new_construction">Xây mới</option>
                <option value="renovation">Cải tạo</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Địa chỉ thi công</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="Số nhà, đường"
              />
              <input
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Phường / xã"
              />
              <input
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Quận / huyện"
              />
              <select
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                {provinces.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Bắt đầu</label>
              <input
                type="date"
                className="mt-2 w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Kết thúc</label>
              <input
                type="date"
                className="mt-2 w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Giá trị hợp đồng (VNĐ)</label>
              <input
                type="number"
                min="0"
                className="mt-2 w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Đã thanh toán (VNĐ)</label>
              <input
                type="number"
                min="0"
                className="mt-2 w-full rounded-3xl border border-slate-200 px-4 py-3"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Ghi chú thanh toán</label>
            <textarea
              className="mt-2 min-h-[100px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
