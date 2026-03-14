'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Database, Zap, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/database', label: 'Base de Datos', icon: Database },
  { href: '/dashboard/calendar', label: 'Calendario', icon: CalendarDays },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass-card rounded-none border-r border-white/10 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-all duration-300">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">EventMaster</h1>
            <p className="text-white/40 text-xs mt-0.5">Gestión de Eventos</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                isActive ? 'sidebar-item-active' : 'sidebar-item',
                'group'
              )}>
                <Icon className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-brand-400' : 'text-white/40 group-hover:text-white/70'
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-brand-400" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
