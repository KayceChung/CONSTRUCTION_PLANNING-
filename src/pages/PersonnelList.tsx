import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useStaffStore } from '../stores/useStaffStore'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

type PersonnelStatus = 'pending' | 'active'

interface PersonnelListProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const statusLabel: Record<PersonnelStatus, string> = {
  pending: 'Chờ kích hoạt',
  active: 'Đang hoạt động',
}

const badgeType: Record<PersonnelStatus, 'pending' | 'success'> = {
  pending: 'pending',
  active: 'success',
}

export default function PersonnelList({ showToast }: PersonnelListProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const staff = useStaffStore((state) => state.staff)
  const updateStaff = useStaffStore((state) => state.updateStaff)
  const projects = useProjectStore((state) => state.projects)
  const [filter, setFilter] = useState<'all' | PersonnelStatus>('all')

  const rows = useMemo(() => {
    return staff.filter((item) => {
      const status: PersonnelStatus = item.isActive ? 'active' : 'pending'
      return filter === 'all' ? true : status === filter
    })
  }, [filter, staff])

  const summary = useMemo(() => {
    const activeCount = staff.filter((item) => item.isActive).length
    const pendingCount = staff.filter((item) => !item.isActive).length
    const projectsWithPersonnel = projects.filter((project) => project.assignedStaff.length > 0).length
    return {
      total: staff.length,
      activeCount,
      pendingCount,
      projectsWithPersonnel,
    }
  }, [staff, projects])

  const getProjectNames = (member: (typeof staff)[number]) => {
    const names = projects.filter((project) => project.assignedStaff.includes(member.id)).map((project) => project.name)
    return names.length > 0 ? names.join(', ') : 'Chưa phân công'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Nhân sự</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Quản lý nhân sự</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            value={filter}
            onChange={(event) => setFilter(event.target.value as 'all' | PersonnelStatus)}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ kích hoạt</option>
            <option value="active">Đang hoạt động</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Họ và tên</th>
                    <th className="px-4 py-3 font-semibold">Chức vụ</th>
                    <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                    <th className="px-4 py-3 font-semibold">Dự án đang tham gia</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => (
                    <tr key={member.id} className="border-t border-slate-200">
                      <td className="px-4 py-4 font-semibold text-slate-900">{member.name}</td>
                      <td className="px-4 py-4">{member.role === 'manager' ? 'Quản lý' : 'Giám sát'}</td>
                      <td className="px-4 py-4">{member.phone}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{getProjectNames(member)}</td>
                      <td className="px-4 py-4">
                        <Badge label={statusLabel[member.isActive ? 'active' : 'pending']} type={badgeType[member.isActive ? 'active' : 'pending']} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/personnel/${member.id}`} className="rounded-2xl bg-brand-900 px-3 py-2 text-xs font-semibold text-white">
                            Xem
                          </Link>
                          <button
                            type="button"
                            className="rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                            onClick={() => navigate(`/personnel/${member.id}`)}
                          >
                            Sửa
                          </button>
                          {user?.role === 'manager' && !member.isActive ? (
                            <>
                              <button
                                type="button"
                                className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                                onClick={async () => {
                                  try {
                                    await updateStaff(member.id, { isActive: true })
                                    showToast(`Đã kích hoạt ${member.name}`, 'success')
                                  } catch (error) {
                                    const message = error instanceof Error ? error.message : 'Không thể kích hoạt nhân sự'
                                    showToast(message, 'error')
                                  }
                                }}
                              >
                                Kích hoạt
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 ? <p className="px-4 py-6 text-sm text-slate-500">Chưa có nhân sự nào phù hợp bộ lọc.</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Tổng quan nhân sự</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Tổng số nhân sự: {summary.total}</p>
              <p>Đang hoạt động: {summary.activeCount}</p>
              <p>Chờ kích hoạt: {summary.pendingCount}</p>
              <p>Dự án có nhân sự: {summary.projectsWithPersonnel}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Tương thích Supabase</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Nhân sự mới cần đăng ký qua màn hình tạo tài khoản để sinh bản ghi trong `auth.users` và `staff`.</p>
              <p>Phân công dự án được lưu trong `projects.assigned_staff`, không lưu trực tiếp trên bảng `staff`.</p>
              <p>Vì Supabase Auth dùng chung phiên đăng nhập trên trình duyệt, tạo tài khoản mới sẽ đăng xuất phiên hiện tại trước khi chuyển sang màn hình đăng ký.</p>
              <Button type="button" className="mt-2 w-full" onClick={async () => {
                await logout()
                navigate('/signup')
              }}>
                Đăng xuất và tạo tài khoản mới
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}