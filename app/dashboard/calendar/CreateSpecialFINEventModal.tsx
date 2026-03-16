'use client'

import React, { useState } from 'react'
import { X, Plus, RefreshCw, Calendar, Clock, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const FIN_TIPOS = [
  'Reunión',
  'Formación',
  'Seguimiento',
  'Presentación',
  'Taller',
  'Otro',
]

export default function CreateSpecialFINEventModal({ onClose, onSuccess }: Props) {
  const [fecha, setFecha]               = useState('')
  const [horainicio, setHorainicio]     = useState('')
  const [horafin, setHorafin]           = useState('')
  const [convocatoria, setConvocatoria] = useState('')
  const [tipo, setTipo]                 = useState('')
  const [tipoCustom, setTipoCustom]     = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const tipoFinal = tipo === 'Otro' ? tipoCustom : tipo

  const handleSave = async () => {
    if (!convocatoria.trim()) { setError('El nombre es obligatorio'); return }
    if (!fecha)               { setError('La fecha es obligatoria'); return }
    if (!horainicio)          { setError('La hora de inicio es obligatoria'); return }
    if (!horafin)             { setError('La hora de fin es obligatoria'); return }
    if (horafin <= horainicio) { setError('La hora de fin debe ser posterior al inicio'); return }
    if (!tipoFinal.trim())    { setError('El tipo es obligatorio'); return }

    setSaving(true)
    setError(null)
    try {
      const { error: dbError } = await supabase
        .from('events_FIN')
        .insert([{ fecha, horainicio, horafin, convocatoria, tipo: tipoFinal }])
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
            <div className="w-8 h-8 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <span
                className="w-4 h-4 bg-yellow-400 inline-block"
                style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
              />
            </div>
            <div>
              <h2 className="text-white font-semibold">Nueva Convocatoria Especial FIN</h2>
              <p className="text-white/40 text-xs">Evento fuera del plan estándar</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-white/40 text-xs mb-1 block">Nombre de la convocatoria</label>
            <input
              type="text"
              value={convocatoria}
              onChange={e => setConvocatoria(e.target.value)}
              placeholder="Ej: Reunión extraordinaria FIN"
              className="input-field text-sm"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Tipo
            </label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Selecciona un tipo...</option>
              {FIN_TIPOS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {tipo === 'Otro' && (
              <input
                type="text"
                value={tipoCustom}
                onChange={e => setTipoCustom(e.target.value)}
                placeholder="Especifica el tipo"
                className="input-field text-sm mt-2"
              />
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Día
            </label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Hora inicio
              </label>
              <input
                type="time"
                value={horainicio}
                onChange={e => setHorainicio(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Hora fin
              </label>
              <input
                type="time"
                value={horafin}
                onChange={e => setHorafin(e.target.value)}
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><Plus className="w-4 h-4" /> Añadir convocatoria</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
