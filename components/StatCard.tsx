'use client'

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: number
  changeLabel?: string
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'pink'
  loading?: boolean
}

const colorVariants = {
  blue: {
    icon: 'bg-brand-50 text-brand-600',
    glow: 'hover:shadow-brand-500/10',
  },
  purple: {
    icon: 'bg-accent-50 text-accent-500',
    glow: 'hover:shadow-accent-500/10',
  },
  green: {
    icon: 'bg-green-50 text-green-600',
    glow: 'hover:shadow-green-500/10',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-600',
    glow: 'hover:shadow-orange-500/10',
  },
  pink: {
    icon: 'bg-pink-50 text-pink-600',
    glow: 'hover:shadow-pink-500/10',
  },
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = 'blue',
  loading = false,
}: StatCardProps) {
  const colors = colorVariants[color]

  const TrendIcon = change === undefined || change === 0
    ? Minus
    : change > 0 ? TrendingUp : TrendingDown

  const trendColor = change === undefined || change === 0
    ? 'text-slate-400'
    : change > 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className={cn('glass-card-hover p-6 transition-all duration-300', colors.glow)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="h-8 bg-slate-100 rounded-lg animate-pulse mb-2" />
          <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
          <p className="text-slate-400 text-sm">{title}</p>
          {changeLabel && (
            <p className={cn('text-xs mt-1', trendColor)}>{changeLabel}</p>
          )}
        </>
      )}
    </div>
  )
}
