import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'

const schema = z.object({
  title: z.string().min(1, 'Tên hạng mục là bắt buộc'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  estimatedDays: z.number().min(1, 'Số ngày thi công phải lớn hơn 0'),
  deadline: z.string().optional()
})

type FormData = z.infer<typeof schema>

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  activeTaskCount: number
}

export default function CreateTaskModal({ isOpen, onClose, onSubmit, activeTaskCount }: CreateTaskModalProps) {
  const [startDate, setStartDate] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('7')
  const [deadline, setDeadline] = useState('')

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      estimatedDays: 7,
      deadline: ''
    }
  })

  const calculateDeadline = (start: string, days: number) => {
    if (!start) return ''
    const date = new Date(start)
    date.setDate(date.getDate() + days)
    return date.toISOString().slice(0, 10)
  }

  useEffect(() => {
    if (startDate && estimatedDays) {
      const calculated = calculateDeadline(startDate, Number(estimatedDays))
      setDeadline(calculated)
      setValue('deadline', calculated)
    }
  }, [startDate, estimatedDays, setValue])

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data)
    onClose()
    setStartDate('')
    setEstimatedDays('7')
    setDeadline('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Tạo hạng mục mới</h2>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Tên hạng mục *</label>
            <input
              {...register('title')}
              className="mt-1 w-full rounded-3xl border border-slate-200 px-4 py-3"
              placeholder="VD: Đổ móng"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Mô tả</label>
            <textarea
              {...register('description')}
              className="mt-1 min-h-[80px] w-full rounded-3xl border border-slate-200 px-4 py-3"
              placeholder="Mô tả chi tiết công việc..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Ngày bắt đầu *</label>
              <input
                type="date"
                {...register('startDate')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-3xl border border-slate-200 px-4 py-3"
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Số ngày thi công *</label>
              <input
                type="number"
                {...register('estimatedDays', { valueAsNumber: true })}
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                className="mt-1 w-full rounded-3xl border border-slate-200 px-4 py-3"
                min="1"
              />
              {errors.estimatedDays && <p className="mt-1 text-sm text-red-600">{errors.estimatedDays.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Deadline</label>
            <input
              type="date"
              {...register('deadline')}
              value={deadline}
              readOnly
              className="mt-1 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              Tạo hạng mục
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}