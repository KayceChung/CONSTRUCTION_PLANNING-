import { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export default function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
        variant === 'danger' && 'bg-rose-500 text-white hover:bg-rose-400',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
