'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, RefreshCw, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, EventRow } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export default function HolidaysModal({
  onClose,
  onSuccess,
  initialYear,
}: {
  onClose: () => void
  onSuccess: () => void
  initialYear?: number
}) {
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear())
  const [holidays, setHolidays] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchHolidays = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('eventmaster_main')
        .select('*')
        .eq('Tipo', 'Festivo')
      if (error) throw error
      const filtered = ((data ?? []) as EventRow[]).filter(e => {
        if (!e['Día']) return false
        const m = e['Día'].match(/^(\d{4})/)
        return m && parseInt(m[1]) === year
      })
      filtered.sort((a, b) => (a['Día'] ?? '').localeCompare(b['Día'] ?? ''))
      setHolidays(filtered)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { fetchHolidays() }, [fetchHolidays])

  const handleAdd = async () => {
    if (!newDate || !newName.trim()) {
      setError('Indica la fecha y el nombre del festivo')
      return
    }
    const selectedYear = parseInt(newDate.split('-')[0])
    if (selectedYear !== year) {
      setError(`La fecha debe pertenecer al año ${year}`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const d = new Date(newDate + 'T12:00:00')
      const dayMes = `${d.getDate()} ${MONTHS_ES[d.getMonth()].substring(0, 3)}`
      const { error } = await supabase.from('eventmaster_main').insert([{
        ID: `festivo-${Date.now()}`,
        CÓDIGO: `F-${newDate}`,
        Actividad: newName.trim(),
        Tipo: 'Festivo',
        Día: newDate,
        'Día Mes': dayMes,
        Convocatoria: `Festivos ${year}`,
        Sesión: null,
        'Hora inicio': null,
        'Hora fin': null,
        Calendar: null,
        Agente: null,
        'Agente 2': null,
        'Agente 3': null,
        'Agente 4': null,
      }])
      if (error) throw error
      setNewName('')
      setNewDate('')
      await fetchHolidays()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const { error } = await supabase.from('eventmaster_main').delete().eq('ID', id)
      if (error) throw error
      await fetchHolidays()
      onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Días Festivos</h2>
              <p className="text-white/40 text-xs">Configura los festivos por año</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year selector */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setYear(y => y - 1)}
            className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white font-semibold text-lg flex-1 text-center">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Holiday list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Star className="w-8 h-8 text-white/10 mx-auto" />
              <p className="text-white/30 text-sm">No hay festivos configurados para {year}</p>
            </div>
          ) : (
            holidays.map(h => (
              <div
                key={h.ID}
                className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 bg-red-400 flex-shrink-0"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  />
                  <div>
                    <p className="text-red-200 text-sm font-medium">{h.Actividad}</p>
                    <p className="text-white/40 text-xs">{h['Día']}</p>
                  </div>
                </div>
                <button
                  onClick={() => h.ID && handleDelete(h.ID)}
                  disabled={deleting === h.ID}
                  className="text-red-400/50 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-40"
                >
                  {deleting === h.ID
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add form */}
        <div className="p-5 border-t border-white/10 flex-shrink-0 space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wider">Añadir festivo</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={e => { setNewDate(e.target.value); setError(null) }}
              min={`${year}-01-01`}
              max={`${year}-12-31`}
              className="input-field text-sm w-44 flex-shrink-0"
            />
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(null) }}
              placeholder="Nombre del festivo"
              className="input-field text-sm flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2"
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><Plus className="w-4 h-4" /> Añadir festivo</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
