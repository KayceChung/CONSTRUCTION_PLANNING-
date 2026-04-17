import { ReactNode } from 'react'
import Button from '../ui/Button'

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export default function Header({ title, description, actions }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-500">{description}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  )
}
