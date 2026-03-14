'use client'

import { Bell, Search, RefreshCw } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export default function TopBar({ title, subtitle, onRefresh, isRefreshing }: TopBarProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white/70 placeholder-white/30 focus:outline-none focus:border-brand-500/50 text-sm w-48 transition-all duration-200 focus:w-64"
          />
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-ghost p-2.5"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        <button className="btn-ghost p-2.5 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-400 rounded-full" />
        </button>
      </div>
    </header>
  )
}
