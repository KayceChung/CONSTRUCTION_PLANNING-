import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { calculateProjectProgress, daysUntil, progressColor } from '../utils/progress'
import Button from '../components/ui/Button'
import { Circle, CalendarDays, SquarePlus } from 'lucide-react'

interface DashboardProps {
  showToast: (message: string) => void
}

export default function Dashboard({ showToast }: DashboardProps) {
  const projects = useProjectStore((state) => state.projects)

  const totalProjects = projects.length
  const inProgressCount = useMemo(
    () => projects.filter((project) => project.tasks.some((task) => task.status === 'in_progress')).length,
    [projects]
  )
  const doneCount = useMemo(
    () => projects.filter((project) => project.tasks.every((task) => task.status === 'done')).length,
    [projects]
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Tổng dự án</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{totalProjects}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Đang thi công</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{inProgressCount}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Hoàn thành</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{doneCount}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Báo cáo tiến độ</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Dự án đang theo dõi</h2>
          </div>
          <Button type="button" variant="secondary" className="flex items-center gap-2" onClick={() => showToast('Tính năng thêm dự án có thể mở rộng sau này')}>
            <SquarePlus size={18} /> Thêm dự án
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => {
            const progress = calculateProjectProgress(project)
            const deadlineDays = daysUntil(project.endDate)
            const ringClasses = progressColor(progress)
            const deadlineClass = deadlineDays <= 7 ? 'text-rose-600' : 'text-slate-600'

            return (
              <Link to={`/projects/${project.id}`} key={project.id} className="group rounded-3xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{project.name}</p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{project.location}</h3>
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800">
                    <Circle className={`h-10 w-10 text-transparent bg-clip-text bg-gradient-to-r ${ringClasses}`} />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Tiến độ</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${progressColor(progress)}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={deadlineClass}>Deadline: {deadlineDays} ngày</span>
                    <span className="text-slate-500">Khách: {project.client}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
