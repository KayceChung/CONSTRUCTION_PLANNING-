import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useProjectStore } from '../stores/useProjectStore'
import { useAuthStore } from '../stores/useAuthStore'
import { calculateProjectProgress } from '../utils/progress'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/modals/ConfirmModal'
import ProjectCreateModal from '../components/modals/ProjectCreateModal'
import { Project } from '../types'

interface ProjectListProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export default function ProjectList({ showToast }: ProjectListProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projects = useProjectStore((state) => state.projects)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const user = useAuthStore((state) => state.user)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const canEdit = user?.role === 'manager'

  // Check for ?action=new in URL and open modal
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowCreateModal(true)
      // Remove the query param from URL
      navigate('/projects', { replace: true })
    }
  }, [searchParams, navigate])

  const handleNavigateToCreate = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Danh sách dự án</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Quản lý dự án</h1>
        </div>
        {canEdit ? (
          <Button type="button" onClick={handleNavigateToCreate}>
            Thêm dự án mới
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <div key={project.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                <p className="mt-1 text-sm text-slate-500">{project.location}</p>
              </div>
              <Badge label={`${calculateProjectProgress(project)}%`} type={project.tasks.every((task) => task.status === 'done') ? 'done' : 'in_progress'} />
            </div>
            <p className="mt-4 text-sm text-slate-600">Chủ đầu tư: {project.client}</p>
            <p className="mt-2 text-sm text-slate-600">Webhook: {project.webhookUrl || 'Chưa cấu hình'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/projects/${project.id}`} className="rounded-2xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Xem chi tiết
              </Link>
              {canEdit ? (
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700"
                  onClick={() => {
                    setActiveProject(project)
                    setShowDelete(true)
                  }}
                >
                  Xóa dự án
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {showDelete && activeProject ? (
        <ConfirmModal
          title="Xóa dự án"
          description={`Bạn có chắc muốn xóa dự án ${activeProject.name}?`}
          onCancel={() => setShowDelete(false)}
          onConfirm={() => {
            deleteProject(activeProject.id)
            setShowDelete(false)
            showToast('Dự án đã được xóa', 'success')
          }}
        />
      ) : null}

      <ProjectCreateModal isOpen={showCreateModal} onClose={handleCloseCreateModal} showToast={showToast} />
    </div>
  )
}
