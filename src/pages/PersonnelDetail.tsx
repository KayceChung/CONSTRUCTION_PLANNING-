import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useStaffStore } from '../stores/useStaffStore'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

type PersonnelStatus = 'pending' | 'active'

interface PersonnelDetailProps {
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

export default function PersonnelDetail({ showToast }: PersonnelDetailProps) {
  const navigate = useNavigate()
  const params = useParams()
  const personnelId = params.personnelId || ''
  const user = useAuthStore((state) => state.user)
  const staff = useStaffStore((state) => state.staff)
  const updateStaff = useStaffStore((state) => state.updateStaff)
  const projects = useProjectStore((state) => state.projects)
  const updateProject = useProjectStore((state) => state.updateProject)

  const member = useMemo(() => staff.find((item) => item.id === personnelId) || null, [staff, personnelId])
  const activeProjects = useMemo(() => projects.filter((project) => new Date(project.endDate) >= new Date()), [projects])
  const assignedProjectIds = useMemo(
    () => projects.filter((project) => project.assignedStaff.includes(personnelId)).map((project) => project.id),
    [personnelId, projects]
  )

  const [role, setRole] = useState<'manager' | 'supervisor'>('supervisor')
  const [phone, setPhone] = useState('')
  const [phone1, setPhone1] = useState('')
  const [phone2, setPhone2] = useState('')
  const [status, setStatus] = useState<PersonnelStatus>('pending')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  useEffect(() => {
    if (!member) return
    setRole(member.role)
    setPhone(member.phone)
    setPhone1(member.phone1 || '')
    setPhone2(member.phone2 || '')
    setStatus(member.isActive ? 'active' : 'pending')
    setSelectedProjects(assignedProjectIds)
  }, [assignedProjectIds, member])

  if (!member || !user) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">Nhân sự không tồn tại.</p>
        <Button type="button" className="mt-4" onClick={() => navigate('/personnel')}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const saveGeneralInfo = async () => {
    try {
      await updateStaff(member.id, {
        phone: phone.trim(),
        phone1: phone1.trim() || undefined,
        phone2: phone2.trim() || undefined,
        isActive: status === 'active',
      })
      showToast('Đã cập nhật thông tin nhân sự', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật thông tin nhân sự'
      showToast(message, 'error')
    }
  }

  const saveRole = async () => {
    if (role === member.role) {
      showToast('Vai trò chưa thay đổi', 'info')
      return
    }
    try {
      await updateStaff(member.id, { role })
      showToast('Đã cập nhật vai trò nhân sự', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật vai trò nhân sự'
      showToast(message, 'error')
    }
  }

  const saveAssignments = async () => {
    try {
      const toRemove = assignedProjectIds.filter((projectId) => !selectedProjects.includes(projectId))
      const toAdd = selectedProjects.filter((projectId) => !assignedProjectIds.includes(projectId))

      for (const projectId of toRemove) {
        const project = projects.find((item) => item.id === projectId)
        if (!project) continue
        await updateProject(project.id, { assignedStaff: project.assignedStaff.filter((id) => id !== member.id) })
      }

      for (const projectId of toAdd) {
        const project = projects.find((item) => item.id === projectId)
        if (!project) continue
        await updateProject(project.id, { assignedStaff: Array.from(new Set([...project.assignedStaff, member.id])) })
      }

      showToast('Đã cập nhật phân công dự án', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật phân công dự án'
      showToast(message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Nhân sự</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{member.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Badge label={statusLabel[member.isActive ? 'active' : 'pending']} type={badgeType[member.isActive ? 'active' : 'pending']} />
            <span className="text-sm text-slate-500">{member.role === 'manager' ? 'Quản lý' : 'Giám sát'}</span>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/personnel')}>
          Quay lại
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Số ĐTH</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">WhatsApp</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={phone1} onChange={(event) => setPhone1(event.target.value)} placeholder="Số WhatsApp" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Zalo</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={phone2} onChange={(event) => setPhone2(event.target.value)} placeholder="Số Zalo" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Email</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500" value={member.email || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Trạng thái</label>
                <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={status} onChange={(event) => setStatus(event.target.value as PersonnelStatus)}>
                  <option value="pending">Chờ kích hoạt</option>
                  <option value="active">Đang hoạt động</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void saveGeneralInfo()}>Lưu thông tin</Button>
              {user.role === 'manager' && !member.isActive ? (
                <>
                  <Button type="button" onClick={async () => {
                    try {
                      await updateStaff(member.id, { isActive: true })
                      showToast('Đã kích hoạt nhân sự', 'success')
                    } catch (error) {
                      const message = error instanceof Error ? error.message : 'Không thể kích hoạt nhân sự'
                      showToast(message, 'error')
                    }
                  }}>
                    Kích hoạt
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Điều chỉnh vai trò</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select className="flex-1 rounded-2xl border border-slate-200 px-4 py-3" value={role} onChange={(event) => setRole(event.target.value as 'manager' | 'supervisor')}>
                <option value="supervisor">Giám sát</option>
                <option value="manager">Quản lý</option>
              </select>
              <Button type="button" onClick={() => void saveRole()} disabled={user.role !== 'manager'}>
                Lưu vai trò
              </Button>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Schema Supabase hiện tại chỉ lưu `role` và `is_active`. Nếu bạn cần chức danh nghiệp vụ, lương, ghi chú HR hoặc lịch sử thay đổi chức vụ, cần bổ sung migration DB riêng.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Phân công dự án</p>
            <div className="mt-4 grid gap-3">
              {activeProjects.map((project) => (
                <label key={project.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={(event) => {
                      setSelectedProjects((current) =>
                        event.target.checked
                          ? [...current, project.id]
                          : current.filter((id) => id !== project.id)
                      )
                    }}
                  />
                  <span>{project.name}</span>
                  <Link to={`/projects/${project.id}`} className="ml-auto text-brand-700 underline">Xem dự án</Link>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <Button type="button" onClick={() => void saveAssignments()} disabled={user.role !== 'manager'}>
                Lưu phân công
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Tổng quan nhân sự</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Trạng thái: {statusLabel[member.isActive ? 'active' : 'pending']}</p>
              <p>Vai trò hiện tại: {member.role === 'manager' ? 'Quản lý' : 'Giám sát'}</p>
              <p>Dự án đang tham gia: {assignedProjectIds.length}</p>
              <p>Ngày tạo: {new Date(member.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}