import clsx from 'clsx'

interface BadgeProps {
  label: string
  type?: 'todo' | 'in_progress' | 'done' | 'adjustment' | 'pending' | 'cancelled' | 'primary' | 'success' | 'secondary'
}

const badgeStyles: Record<NonNullable<BadgeProps['type']>, string> = {
  todo: 'bg-gray-100 text-slate-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  adjustment: 'bg-amber-100 text-amber-700 border-amber-300',
  pending: 'bg-orange-100 text-orange-700 border-orange-300',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-300',
  primary: 'bg-blue-100 text-blue-700 border-blue-300',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  secondary: 'bg-slate-200 text-slate-700 border-slate-300'
}

export default function Badge({ label, type = 'todo' }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', badgeStyles[type])}>
      {label}
    </span>
  )
}
