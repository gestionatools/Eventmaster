'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Search, Mail, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'

interface Attendee {
  id: string
  event_id: string
  name: string
  email: string
  status: 'registered' | 'confirmed' | 'cancelled' | 'attended'
  registered_at: string
  event_title?: string
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchAttendees = useCallback(async () => {
    try {
      const [attendeesRes, eventsRes] = await Promise.all([
        supabase.from('attendees').select('*').order('registered_at', { ascending: false }),
        supabase.from('events').select('id, title'),
      ])

      const events = eventsRes.data || []
      const eventMap: Record<string, string> = {}
      events.forEach(e => { eventMap[e.id] = e.title })

      const withTitles = (attendeesRes.data || []).map(a => ({
        ...a,
        event_title: eventMap[a.event_id] || 'Evento desconocido',
      }))

      setAttendees(withTitles)
    } catch (error) {
      console.error('Error fetching attendees:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees])

  const filtered = attendees.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.event_title || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Asistentes"
        subtitle={`${attendees.length} asistentes registrados`}
        onRefresh={() => { setRefreshing(true); fetchAttendees() }}
        isRefreshing={refreshing}
      />

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'registered', 'confirmed', 'attended', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                statusFilter === s
                  ? 'bg-brand-500/30 text-brand-300 border border-brand-500/40'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Asistente</th>
                <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider hidden lg:table-cell">Evento</th>
                <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider hidden sm:table-cell">Fecha Registro</th>
                <th className="text-left text-white/40 text-xs font-medium px-6 py-4 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-white/20" />
                      <p className="text-white/30 text-sm">No se encontraron asistentes</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((att) => (
                  <tr key={att.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-500/30 to-accent-500/30 rounded-lg flex items-center justify-center text-sm font-semibold text-brand-300 flex-shrink-0">
                          {att.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-medium">{att.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-white/50 text-sm flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {att.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-white/60 text-sm flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        {att.event_title}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-white/40 text-sm">{formatDate(att.registered_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={att.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
