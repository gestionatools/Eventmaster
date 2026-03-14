'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, Users, TrendingUp, CheckCircle, Clock, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import TopBar from '@/components/TopBar'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  totalEvents: number
  upcomingEvents: number
  totalAttendees: number
  completedEvents: number
}

interface RecentEvent {
  id: string
  title: string
  date: string
  location: string | null
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  category: string | null
  attendee_count?: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, attendeesRes] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('attendees').select('*'),
      ])

      const events = eventsRes.data || []
      const attendees = attendeesRes.data || []

      setStats({
        totalEvents: events.length,
        upcomingEvents: events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length,
        totalAttendees: attendees.length,
        completedEvents: events.filter(e => e.status === 'completed').length,
      })

      const recent = events
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(event => ({
          ...event,
          attendee_count: attendees.filter(a => a.event_id === event.id).length,
        }))

      setRecentEvents(recent)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Dashboard"
        subtitle="Bienvenido a EventMaster"
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Eventos"
          value={stats?.totalEvents ?? 0}
          icon={Calendar}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Eventos Activos"
          value={stats?.upcomingEvents ?? 0}
          icon={Clock}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Total Asistentes"
          value={stats?.totalAttendees ?? 0}
          icon={Users}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Completados"
          value={stats?.completedEvents ?? 0}
          icon={CheckCircle}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Recent Events */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Eventos Recientes</h2>
            <p className="text-white/40 text-sm mt-0.5">Los últimos eventos registrados</p>
          </div>
          <Link href="/dashboard/events" className="btn-ghost flex items-center gap-2 text-sm">
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                <div className="glass-card-hover p-4 flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500/30 to-accent-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate group-hover:text-brand-300 transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(event.date)}
                      </span>
                      {event.location && (
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1 text-white/40 text-xs">
                      <Users className="w-3.5 h-3.5" />
                      <span>{event.attendee_count}</span>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white/50 text-lg font-medium">No hay eventos aún</p>
      <p className="text-white/30 text-sm mt-2">Crea tu primer evento para comenzar</p>
      <Link href="/dashboard/events" className="btn-primary inline-flex items-center gap-2 mt-6 text-sm">
        <TrendingUp className="w-4 h-4" />
        Crear Evento
      </Link>
    </div>
  )
}
