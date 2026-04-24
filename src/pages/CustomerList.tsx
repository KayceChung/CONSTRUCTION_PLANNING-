import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useCustomerStore } from '../stores/useCustomerStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useAuthStore } from '../stores/useAuthStore'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import NewCustomerModal from '../components/modals/NewCustomerModal'
import ConfirmModal from '../components/modals/ConfirmModal'
import { Customer } from '../types'

const sortOptions = [
  { value: 'name', label: 'Tên A-Z' },
  { value: 'projectCount', label: 'Số dự án' },
  { value: 'totalValue', label: 'Tổng giá trị' }
]

export default function CustomerList({ showToast }: { showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const customers = useCustomerStore((state) => state.customers)
  const addCustomer = useCustomerStore((state) => state.addCustomer)
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer)
  const projects = useProjectStore((state) => state.projects)

  const [searchText, setSearchText] = useState('')
  const [debtFilter, setDebtFilter] = useState<'all' | 'debt' | 'clear'>('all')
  const [sortKey, setSortKey] = useState('name')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleAddCustomer = async (customerData: {
    fullName: string
    phone: string
    phone2?: string
    email?: string
    address?: string
    note?: string
  }) => {
    try {
      const newCustomer = {
        id: uuidv4(),
        fullName: customerData.fullName,
        phone: customerData.phone,
        phone2: customerData.phone2,
        email: customerData.email,
        address: customerData.address,
        note: customerData.note,
        status: 'lead' as const,
        projectIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await addCustomer(newCustomer)
      setIsModalOpen(false)
      showToast(`Đã thêm khách hàng "${customerData.fullName}" thành công`, 'success')
    } catch (error) {
      console.error('Error adding customer:', error)
      showToast('Lỗi khi thêm khách hàng', 'error')
    }
  }

  const rows = useMemo(() => 
    customers
      .map((customer) => {
        const customerProjects = projects.filter((project) => project.customerId === customer.id)
        const totalValue = customerProjects.reduce((sum, project) => sum + project.contractValue, 0)
        const paidValue = customerProjects.reduce((sum, project) => sum + project.paidAmount, 0)
        const hasDebt = paidValue < totalValue
        const latestProject = customerProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        return { customer, customerProjects, totalValue, paidValue, hasDebt, latestProject }
      })
      .filter(({ customer }) => {
        const query = searchText.trim().toLowerCase()
        if (!query) return true
        return customer.fullName.toLowerCase().includes(query) || customer.phone.includes(query)
      })
      .filter(({ hasDebt }) => {
        if (debtFilter === 'debt') return hasDebt
        if (debtFilter === 'clear') return !hasDebt
        return true
      })
      .sort((a, b) => {
        if (sortKey === 'name') return a.customer.fullName.localeCompare(b.customer.fullName, 'vi')
        if (sortKey === 'projectCount') return b.customerProjects.length - a.customerProjects.length
        if (sortKey === 'totalValue') return b.totalValue - a.totalValue
        return 0
      }),
    [customers, projects, searchText, debtFilter, sortKey]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Khách hàng</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Quản lý khách hàng</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            + Thêm khách hàng
          </button>
          <Link to="/projects/new" className="inline-flex items-center justify-center rounded-2xl bg-brand-900 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Thêm dự án mới
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-slate-900">Bộ lọc</p>
              <input
                className="w-full rounded-3xl border border-slate-200 px-4 py-3"
                placeholder="Tìm theo tên hoặc số điện thoại"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select className="rounded-3xl border border-slate-200 bg-white px-4 py-3" value={debtFilter} onChange={(event) => setDebtFilter(event.target.value as any)}>
                <option value="all">Tất cả</option>
                <option value="debt">Có nợ</option>
                <option value="clear">Không nợ</option>
              </select>
              <select className="rounded-3xl border border-slate-200 bg-white px-4 py-3" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tên KH</th>
                    <th className="px-4 py-3 font-semibold">SĐT</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Số dự án</th>
                    <th className="px-4 py-3 font-semibold">Tổng giá trị</th>
                    <th className="px-4 py-3 font-semibold">Còn nợ</th>
                    <th className="px-4 py-3 font-semibold">Dự án gần nhất</th>
                    <th className="px-4 py-3 font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ customer, customerProjects, totalValue, paidValue, hasDebt, latestProject }) => (
                    <tr key={customer.id} className="border-t border-slate-200">
                      <td className="px-4 py-4 font-semibold text-slate-900">{customer.fullName}</td>
                      <td className="px-4 py-4">{customer.phone}</td>
                      <td className="px-4 py-4">
                        <Badge 
                          label={
                            customer.status === 'lead' ? 'Tiềm năng' :
                            customer.status === 'nurturing' ? 'Chăm sóc' :
                            customer.status === 'contracted' ? 'Đã ký' :
                            'Không hoạt động'
                          }
                          type={
                            customer.status === 'lead' ? 'primary' :
                            customer.status === 'nurturing' ? 'in_progress' :
                            customer.status === 'contracted' ? 'success' :
                            'secondary'
                          }
                        />
                      </td>
                      <td className="px-4 py-4">{customerProjects.length}</td>
                      <td className="px-4 py-4">{new Intl.NumberFormat('vi-VN').format(totalValue)} đ</td>
                      <td className="px-4 py-4">{hasDebt ? '⚠️ Còn nợ' : 'Không nợ'}</td>
                      <td className="px-4 py-4">{latestProject ? latestProject.name : 'Không có'}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                          >
                            Xem
                          </button>
                          {user?.role === 'manager' ? (
                            <button
                              type="button"
                              className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                              onClick={() => {
                                setActiveCustomer(customer)
                                setShowDeleteModal(true)
                              }}
                            >
                              Xóa
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Tổng quan</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Khách hàng: {customers.length}</p>
              <p>Giá trị hợp đồng tổng: {new Intl.NumberFormat('vi-VN').format(projects.reduce((sum, project) => sum + project.contractValue, 0))} đ</p>
              <p>Còn nợ tổng: {new Intl.NumberFormat('vi-VN').format(projects.reduce((sum, project) => sum + Math.max(0, project.contractValue - project.paidAmount), 0))} đ</p>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Gợi ý</p>
            <p className="mt-2 text-sm text-slate-600">Chọn khách hàng để xem lịch sử liên hệ, báo cáo tài chính và tạo dự án mới cho khách này.</p>
          </div>
        </div>
      </div>

      <NewCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddCustomer} />

      {showDeleteModal && activeCustomer ? (
        <ConfirmModal
          title="Xóa khách hàng"
          description={`Bạn có chắc muốn xóa khách hàng "${activeCustomer.fullName}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            try {
              await deleteCustomer(activeCustomer.id)
              setShowDeleteModal(false)
              setActiveCustomer(null)
              showToast(`Đã xóa khách hàng "${activeCustomer.fullName}"`, 'success')
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Không thể xóa khách hàng'
              showToast(message, 'error')
            }
          }}
        />
      ) : null}
    </div>
  )
}
