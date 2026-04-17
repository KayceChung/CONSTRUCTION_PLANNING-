import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Badge from '../ui/Badge'
import { Task } from '../../types'
import { formatDate } from '../../utils/progress'
import { motion } from 'framer-motion'

interface KanbanCardProps {
  task: Task
  onOpen: () => void
}

export default function KanbanCard({ task, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      className={`rounded-3xl border p-4 shadow-sm transition ${isDragging ? 'border-brand-500 bg-brand-50 shadow-lg' : 'border-slate-200 bg-white'}`}
    >
      <button type="button" onClick={onOpen} className="text-left">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
          <Badge label={`${task.weight}%`} type={task.status} />
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>{task.description}</p>
          <p>Cuối cùng: {task.updatedBy}</p>
          <p>{formatDate(task.updatedAt)}</p>
        </div>
        {task.images.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {task.images.slice(0, 3).map((src, index) => (
              <img key={index} src={src} alt="Ảnh" className="h-16 w-full rounded-2xl object-cover" />
            ))}
          </div>
        ) : null}
      </button>
    </motion.div>
  )
}
