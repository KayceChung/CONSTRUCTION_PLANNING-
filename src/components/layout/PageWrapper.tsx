import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return <main className="min-h-screen bg-slate-50 p-4 lg:p-8">{children}</main>
}
