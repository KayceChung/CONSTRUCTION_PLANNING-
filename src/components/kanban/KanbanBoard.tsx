import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import { Project, Task, TaskStatus, User } from '../../types'
import { useMemo } from 'react'

interface KanbanBoardProps {
  project: Project
  user: User
  onOpenTask: (task: Task) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

const columns: Array<{ id: TaskStatus; title: string; colorClass: string }> = [
  { id: 'todo', title: 'Chưa bắt đầu', colorClass: 'border-gray-300 bg-gray-50' },
  { id: 'in_progress', title: 'Đang thi công', colorClass: 'border-blue-400 bg-blue-50' },
  { id: 'done', title: 'Hoàn thành', colorClass: 'border-emerald-400 bg-emerald-50' },
  { id: 'adjustment', title: 'Điều chỉnh', colorClass: 'border-amber-400 bg-amber-50' },
  { id: 'pending', title: 'Tạm dừng', colorClass: 'border-orange-400 bg-orange-50' },
  { id: 'cancelled', title: 'Hủy bỏ', colorClass: 'border-rose-400 bg-rose-50' }
]

export default function KanbanBoard({ project, user, onOpenTask, onStatusChange }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const activeTaskCount = useMemo(() => project.tasks.filter((task) => task.status !== 'cancelled').length, [project.tasks])

  const itemsByStatus = useMemo(() => {
    return columns.reduce<Record<TaskStatus, Task[]>>((acc, column) => {
      acc[column.id] = project.tasks
        .filter((task) => task.status === column.id)
        .sort((a, b) => a.order - b.order)
      return acc
    }, {
      todo: [],
      in_progress: [],
      done: [],
      adjustment: [],
      pending: [],
      cancelled: []
    })
  }, [project.tasks])

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = event.active.id
    const overId = event.over?.id
    if (!overId || activeId === overId) return

    const task = project.tasks.find((item) => item.id === activeId)
    if (!task) return

    const targetColumn = columns.find((column) => column.id === overId)
    if (!targetColumn) return

    if (user.role === 'supervisor' && !(targetColumn.id === 'in_progress' || targetColumn.id === 'done' || targetColumn.id === 'adjustment' || targetColumn.id === 'pending')) {
      return
    }

    onStatusChange(task.id, targetColumn.id)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 overflow-x-auto pb-4 lg:grid-cols-6 lg:pr-4">
        {columns.map((column) => (
          <KanbanColumn key={column.id} id={column.id} title={column.title} colorClass={column.colorClass}>
            <SortableContext items={itemsByStatus[column.id].map((task) => task.id)} strategy={verticalListSortingStrategy}>
              {itemsByStatus[column.id].map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  totalTasks={activeTaskCount}
                  onOpen={() => onOpenTask(task)}
                />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  )
}
