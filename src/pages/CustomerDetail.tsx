import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomerStore } from '../stores/useCustomerStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useAuthStore } from '../stores/useAuthStore'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { formatDate } from '../utils/progress'

const contactMethods = [
  { value: 'phone', label: 'Gọi điện' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'meeting', label: 'Gặp trực tiếp' },
  { value: 'email', label: 'Email' }
]

export default function CustomerDetail({ showToast }: { showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const params = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const customers = useCustomerStore((state) => state.customers)
  const contactLogs = useCustomerStore((state) => state.contactLogs)
  const addContactLog = useCustomerStore((state) => state.addContactLog)
  const projects = useProjectStore((state) => state.projects)

  const customer = useMemo(() => customers.find((item) => item.id === params.customerId) || null, [customers, params.customerId])
  const customerProjects = useMemo(() => projects.filter((project) => project.customerId === params.customerId), [projects, params.customerId])
  const customerLogs = useMemo(() => contactLogs.filter((log) => log.customerId === params.customerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [contactLogs, params.customerId])

  const [tab, setTab] = useState<'projects' | 'finance' | 'history'>('projects')
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().slice(0, 10))
  const [newLogMethod, setNewLogMethod] = useState<'phone' | 'zalo' | 'meeting' | 'email'>('phone')
  const [newLogContent, setNewLogContent] = useState('')

  if (!customer) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">Khách hàng không tồn tại.</p>
        <Button type="button" className="mt-4" onClick={() => navigate('/customers')}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const totalValue = customerProjects.reduce((sum, project) => sum + project.contractValue, 0)
  const totalPaid = customerProjects.reduce((sum, project) => sum + project.paidAmount, 0)
  const totalRemaining = totalValue - totalPaid
  const loyaltyBadge = customerProjects.length >= 3

  const handleAddLog = () => {
    if (!user) return
    if (!newLogContent) {
      showToast('Vui lòng nhập nội dung liên hệ', 'error')
      return
    }
    addContactLog({
      id: `log-${Date.now()}`,
      customerId: customer.id,
      date: newLogDate,
      method: newLogMethod,
      content: newLogContent,
      createdBy: user.name,
      createdAt: new Date().toISOString()
    })
    setNewLogContent('')
    showToast('Đã lưu lịch sử liên hệ', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Thông tin khách hàng</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{customer.fullName}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => navigate('/projects/new', { state: { customerId: customer.id } })}>
              + Tạo dự án mới
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">SĐT</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{customer.phone}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">Email</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{customer.email || '-'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">Địa chỉ</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{customer.address || '-'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">Dự án</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{customerProjects.length}</p>
          </div>
          {loyaltyBadge ? (
            <Badge label="Khách hàng thân thiết" type="success" />
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {['projects', 'finance', 'history'].map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-full px-5 py-2 text-sm font-semibold ${tab === item ? 'bg-brand-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              onClick={() => setTab(item as any)}
            >
              {item === 'projects' ? '📋 Dự án' : item === 'finance' ? '💰 Tài chính' : '📞 Lịch sử liên hệ'}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'projects' ? (
            <div className="space-y-4">
              {customerProjects.length === 0 ? (
                <p className="text-sm text-slate-600">Khách hàng chưa có dự án nào.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-semibold">Tên dự án</th>
                        <th className="px-4 py-3 font-semibold">Loại hình</th>
                        <th className="px-4 py-3 font-semibold">Tiến độ</th>
                        <th className="px-4 py-3 font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 font-semibold">Giá trị HĐ</th>
                        <th className="px-4 py-3 font-semibold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerProjects.map((project) => (
                        <tr key={project.id} className="border-t border-slate-200">
                          <td className="px-4 py-4 font-semibold text-slate-900">{project.name}</td>
                          <td className="px-4 py-4">{project.category === 'new_construction' ? 'Xây mới' : project.category === 'renovation' ? 'Cải tạo' : 'Khác'}</td>
                          <td className="px-4 py-4">{Math.round((project.tasks.filter((task) => task.status === 'done').length / Math.max(1, project.tasks.filter((task) => task.status !== 'cancelled').length)) * 100)}%</td>
                          <td className="px-4 py-4">{project.tasks.every((task) => task.status === 'done') ? 'Hoàn thành' : 'Đang thi công'}</td>
                          <td className="px-4 py-4">{new Intl.NumberFormat('vi-VN').format(project.contractValue)} đ</td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700"
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : tab === 'finance' ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-600">Tổng giá trị HĐ</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN').format(totalValue)} đ</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-600">Đã thanh toán</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN').format(totalPaid)} đ</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-600">Còn nợ</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN').format(totalRemaining)} đ</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 font-semibold">Dự án</th>
                      <th className="px-4 py-3 font-semibold">Giá trị</th>
                      <th className="px-4 py-3 font-semibold">Đã TT</th>
                      <th className="px-4 py-3 font-semibold">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerProjects.map((project) => (
                      <tr key={project.id} className="border-t border-slate-200">
                        <td className="px-4 py-4">{project.name}</td>
                        <td className="px-4 py-4">{new Intl.NumberFormat('vi-VN').format(project.contractValue)} đ</td>
                        <td className="px-4 py-4">{new Intl.NumberFormat('vi-VN').format(project.paidAmount)} đ</td>
                        <td className="px-4 py-4">{new Intl.NumberFormat('vi-VN').format(Math.max(0, project.contractValue - project.paidAmount))} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">Ghi nhận liên hệ mới</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Ngày liên hệ</label>
                    <input
                      type="date"
                      className="w-full rounded-3xl border border-slate-200 px-4 py-3"
                      value={newLogDate}
                      onChange={(event) => setNewLogDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Hình thức</label>
                    <select
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                      value={newLogMethod}
                      onChange={(event) => setNewLogMethod(event.target.value as any)}
                    >
                      {contactMethods.map((method) => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Nội dung</label>
                  <textarea
                    className="min-h-[120px] w-full rounded-3xl border border-slate-200 px-4 py-3"
                    value={newLogContent}
                    onChange={(event) => setNewLogContent(event.target.value)}
                    placeholder="VD: Gọi hỏi tiến độ, khách cần chỉnh sửa bản vẽ 3 lần..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={handleAddLog}>Lưu liên hệ</Button>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="space-y-4">
                  {customerLogs.length === 0 ? (
                    <p className="text-sm text-slate-600">Chưa có lịch sử liên hệ nào.</p>
                  ) : (
                    customerLogs.map((log) => (
                      <div key={log.id} className="rounded-3xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{formatDate(log.date)}</p>
                          <Badge label={log.method === 'phone' ? 'Gọi điện' : log.method === 'zalo' ? 'Zalo' : log.method === 'meeting' ? 'Gặp trực tiếp' : 'Email'} type="secondary" />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{log.content}</p>
                        <p className="mt-3 text-xs text-slate-500">Ghi bởi {log.createdBy}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
