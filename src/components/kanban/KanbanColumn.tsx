import { ReactNode } from 'react'

interface KanbanColumnProps {
  title: string
  colorClass: string
  id: string
  children: ReactNode
}

export default function KanbanColumn({ title, colorClass, id, children }: KanbanColumnProps) {
  return (
    <div id={id} className={`min-h-[28rem] w-full rounded-3xl border p-4 ${colorClass}`}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
