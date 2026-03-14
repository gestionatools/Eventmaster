'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, Plus, Search, Filter, MapPin, Clock, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'

type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

interface Event {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  capacity: number | null
  status: EventStatus
  category: string | null
  created_at: string
  attendee_count?: number
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'ongoing', label: 'En curso' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchEvents = useCallback(async () => {
    try {
      const [eventsRes, attendeesRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('attendees').select('event_id'),
      ])

      const rawEvents = eventsRes.data || []
      const attendees = attendeesRes.data || []

      const withCounts = rawEvents.map(event => ({
        ...event,
        attendee_count: attendees.filter(a => a.event_id === event.id).length,
      }))

      setEvents(withCounts)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  const filtered = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.location || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Eventos"
        subtitle={`${events.length} eventos registrados`}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-white/40" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === f.value
                  ? 'bg-brand-500/30 text-brand-300 border border-brand-500/40'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm">
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </Link>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/50 text-lg font-medium">No se encontraron eventos</p>
          <p className="text-white/30 text-sm mt-2">
            {search || statusFilter !== 'all' ? 'Intenta con otros filtros' : 'Crea tu primer evento'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/dashboard/events/${event.id}`}>
      <div className="glass-card-hover p-5 h-full flex flex-col gap-4 group cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500/30 to-accent-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-brand-400" />
          </div>
          <StatusBadge status={event.status} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg leading-snug group-hover:text-brand-300 transition-colors line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-white/40 text-sm mt-2 line-clamp-2">{event.description}</p>
          )}
        </div>

        {/* Meta */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Users className="w-3.5 h-3.5" />
              <span>
                {event.attendee_count} asistentes
                {event.capacity && ` / ${event.capacity}`}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors" />
          </div>
        </div>

        {event.capacity && event.attendee_count !== undefined && (
          <div className="mt-2">
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-brand-500 to-accent-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (event.attendee_count / event.capacity) * 100)}%`
                }}
              />
            </div>
            <p className="text-white/30 text-xs mt-1">
              {Math.round((event.attendee_count / event.capacity) * 100)}% de capacidad
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
