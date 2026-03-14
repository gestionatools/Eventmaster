import { cn, statusColors, statusLabels } from '@/lib/utils'

type Status = keyof typeof statusColors

interface StatusBadgeProps {
  status: Status
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border',
      statusColors[status],
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {statusLabels[status]}
    </span>
  )
}
