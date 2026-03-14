'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, MapPin, Users, Clock, Tag, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import { formatDateTime } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  capacity: number | null
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  category: string | null
  created_at: string
}

interface Attendee {
  id: string
  name: string
  email: string
  status: 'registered' | 'confirmed' | 'cancelled' | 'attended'
  registered_at: string
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      const [eventRes, attendeesRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('attendees').select('*').eq('event_id', id).order('registered_at', { ascending: false }),
      ])

      setEvent(eventRes.data)
      setAttendees(attendeesRes.data || [])
      setLoading(false)
    }
    fetchEvent()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', id)
    router.push('/dashboard/events')
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-8 bg-white/5 rounded-lg animate-pulse mb-8 w-64" />
        <div className="glass-card h-64 animate-pulse mb-6" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="glass-card p-16 text-center">
        <p className="text-white/50 text-lg">Evento no encontrado</p>
        <Link href="/dashboard/events" className="btn-primary inline-flex mt-6">
          Volver a eventos
        </Link>
      </div>
    )
  }

  const occupancyPct = event.capacity
    ? Math.round((attendees.length / event.capacity) * 100)
    : null

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/events" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          <p className="text-white/50 text-sm mt-0.5">Detalles del evento</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Link href={`/dashboard/events/${id}/edit`} className="btn-secondary flex items-center gap-2 text-sm">
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <StatusBadge status={event.status} />
              {event.category && (
                <span className="text-white/40 text-sm flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {event.category}
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-white/70 leading-relaxed">{event.description}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-500/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Fecha</p>
                  <p className="text-white text-sm font-medium">{formatDateTime(event.date)}</p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Ubicación</p>
                    <p className="text-white text-sm font-medium">{event.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Asistentes</p>
                  <p className="text-white text-sm font-medium">
                    {attendees.length}
                    {event.capacity && <span className="text-white/40"> / {event.capacity}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Creado</p>
                  <p className="text-white text-sm font-medium">{formatDateTime(event.created_at)}</p>
                </div>
              </div>
            </div>

            {occupancyPct !== null && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>Ocupación</span>
                  <span>{occupancyPct}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-accent-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, occupancyPct)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Attendees List */}
          <div className="glass-card p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Asistentes ({attendees.length})
            </h2>

            {attendees.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No hay asistentes registrados</p>
            ) : (
              <div className="space-y-2">
                {attendees.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-500/30 to-accent-500/30 rounded-lg flex items-center justify-center text-sm font-semibold text-brand-300">
                        {att.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{att.name}</p>
                        <p className="text-white/40 text-xs">{att.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={att.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats sidebar */}
        <div className="space-y-4">
          {[
            { label: 'Registrados', value: attendees.filter(a => a.status === 'registered').length, color: 'text-yellow-400' },
            { label: 'Confirmados', value: attendees.filter(a => a.status === 'confirmed').length, color: 'text-green-400' },
            { label: 'Asistieron', value: attendees.filter(a => a.status === 'attended').length, color: 'text-brand-400' },
            { label: 'Cancelados', value: attendees.filter(a => a.status === 'cancelled').length, color: 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-white/40 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
