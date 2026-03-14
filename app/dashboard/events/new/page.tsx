'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Users, FileText, Tag, Save } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['Conferencia', 'Workshop', 'Networking', 'Festival', 'Deportivo', 'Cultural', 'Formación', 'Otro']

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    category: '',
    status: 'upcoming' as const,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('events').insert({
      title: form.title,
      description: form.description || null,
      date: form.date,
      location: form.location || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      category: form.category || null,
      status: form.status,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/dashboard/events')
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/events" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo Evento</h1>
          <p className="text-white/50 text-sm mt-0.5">Completa los detalles del evento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="glass-card p-4 border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="glass-card p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-400" />
            Información General
          </h2>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Título del Evento *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ej: Conferencia Tech 2025"
              className="input-field"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe el evento..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Categoría
              </label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="input-field"
              >
                <option value="">Sin categoría</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 block">Estado</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof form.status }))}
                className="input-field"
              >
                <option value="upcoming">Próximo</option>
                <option value="ongoing">En curso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            Fecha y Lugar
          </h2>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Fecha y Hora *</label>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Ubicación
            </label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="Ej: Centro de Convenciones, Madrid"
              className="input-field"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Capacidad máxima
            </label>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
              placeholder="Ej: 500"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard/events" className="btn-secondary flex-1 flex items-center justify-center gap-2">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Crear Evento'}
          </button>
        </div>
      </form>
    </div>
  )
}
