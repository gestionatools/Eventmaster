'use client'

import React, { useState } from 'react'
import { X, Plus, RefreshCw, MapPin, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateGestionaEventModal({ onClose, onSuccess }: Props) {
  const [nombre, setNombre]             = useState('')
  const [emplazamiento, setEmplazamiento] = useState('')
  const [fechainicio, setFechainicio]   = useState('')
  const [fechafin, setFechafin]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!fechainicio)   { setError('La fecha de inicio es obligatoria'); return }
    if (!fechafin)      { setError('La fecha de fin es obligatoria'); return }
    if (fechafin < fechainicio) { setError('La fecha de fin debe ser posterior al inicio'); return }

    setSaving(true)
    setError(null)
    try {
      const { error: dbError } = await supabase
        .from('events_Gestiona')
        .insert([{ nombre, emplazamiento, fechainicio, fechafin }])
      if (dbError) throw dbError
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-md animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
              <span
                className="w-4 h-4 bg-red-400"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
            </div>
            <h2 className="text-white font-semibold">Nuevo Evento Gestiona</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-white/40 text-xs mb-1 block">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del evento"
              className="input-field text-sm"
            />
          </div>

          {/* Emplazamiento */}
          <div>
            <label className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Emplazamiento
            </label>
            <input
              type="text"
              value={emplazamiento}
              onChange={e => setEmplazamiento(e.target.value)}
              placeholder="Lugar del evento"
              className="input-field text-sm"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Fecha inicio
              </label>
              <input
                type="datetime-local"
                value={fechainicio}
                onChange={e => setFechainicio(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Fecha fin
              </label>
              <input
                type="datetime-local"
                value={fechafin}
                onChange={e => setFechafin(e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all disabled:opacity-50"
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><Plus className="w-4 h-4" /> Crear evento</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
