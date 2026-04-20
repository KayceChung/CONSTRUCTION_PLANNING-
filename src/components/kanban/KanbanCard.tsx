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
      className={`rounded-xl border-2 p-4 shadow transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${isDragging ? 'border-blue-500 bg-blue-100 shadow-lg scale-105' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      whileHover={{ y: -2 }}
    >
      <button type="button" onClick={onOpen} className="text-left w-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 flex-1">{task.title}</h3>
          <Badge label={contributionText} type={task.status} />
        </div>
        
        {task.description && (
          <p className="text-xs text-slate-600 line-clamp-1 mb-2">{task.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
          {task.estimatedDays && (
            <span className="bg-slate-100 px-2 py-1 rounded-full">⏱️ {task.estimatedDays} ngày</span>
          )}
          {task.deadline && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">📅 {formatDate(task.deadline)}</span>
          )}
        </div>
        
        {task.images.length > 0 ? (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {task.images.slice(0, 2).map((src, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 h-12">
                {isVideoUrl(src) ? (
                  <video controls className="h-full w-full object-cover text-xs">
                    <source src={src} />
                  </video>
                ) : (
                  <img src={src} alt="Ảnh" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </button>
    </motion.div>
  )
}
