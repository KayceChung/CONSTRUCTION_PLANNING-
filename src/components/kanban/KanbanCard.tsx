import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Badge from '../ui/Badge'
import { Task } from '../../types'
import { formatDate } from '../../utils/progress'
import { motion } from 'framer-motion'

function isVideoUrl(src: string) {
  const lower = src.toLowerCase()
  return lower.startsWith('data:video/') || lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg')
}

interface KanbanCardProps {
  task: Task
  totalTasks: number
  onOpen: () => void
}

export default function KanbanCard({ task, totalTasks, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const weight = totalTasks > 0 ? Math.round(100 / totalTasks) : 0
  const contributionText = task.status === 'cancelled'
    ? 'Hủy bỏ'
    : totalTasks > 0
    ? `Đóng góp 1/${totalTasks} · ${weight}%`
    : 'Đóng góp 0%'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      title={task.status === 'cancelled' ? 'Hạng mục đã hủy và không tính vào tiến độ' : `Hoàn thành hạng mục này sẽ tăng tiến độ thêm ${weight}%`}
      className={`rounded-3xl border p-4 shadow-sm transition ${isDragging ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-slate-200 bg-white'}`}
    >
      <button type="button" onClick={onOpen} className="text-left">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
          <Badge label={contributionText} type={task.status} />
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>{task.description}</p>
          <p>Cuối cùng: {task.updatedBy}</p>
          <p>{formatDate(task.updatedAt)}</p>
        </div>
        {task.images.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {task.images.slice(0, 3).map((src, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {isVideoUrl(src) ? (
                  <video controls className="h-16 w-full object-cover">
                    <source src={src} />
                  </video>
                ) : (
                  <img src={src} alt="Ảnh" className="h-16 w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </button>
    </motion.div>
  )
}
