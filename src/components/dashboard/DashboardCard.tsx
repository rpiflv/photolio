import type { ReactNode } from 'react'

interface DashboardCardProps {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function DashboardCard({
  title,
  action,
  children,
  className = '',
  bodyClassName = 'p-6',
}: DashboardCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`.trim()}>
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
