import { ReactNode } from 'react'

interface KanbanColumnProps {
  title: string
  colorClass: string
  id: string
  children: ReactNode
}

export default function KanbanColumn({ title, colorClass, id, children }: KanbanColumnProps) {
  return (
    <div 
      id={id} 
      className={`flex flex-col min-h-screen lg:min-h-[600px] rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow border-2 ${colorClass}`}
    >
      <div className="mb-5 pb-4 border-b border-slate-300/40">
        <h2 className="text-lg font-bold text-slate-900 truncate">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">Kéo thả để cập nhật trạng thái</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">{children}</div>
    </div>
  )
}
