'use client'

import React, { useState } from 'react'
import { X, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Props {
  convocatorias: string[]           // list of available convocatorias
  selectedConvocatoria?: string     // pre-selected from filter
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteConvocatoriaModal({
  convocatorias,
  selectedConvocatoria,
  onClose,
  onSuccess,
}: Props) {
  const [selected, setSelected] = useState(selectedConvocatoria ?? '')
  const [confirmed, setConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [deletedCount, setDeletedCount] = useState(0)

  const handleDelete = async () => {
    if (!selected || !confirmed) return
    setDeleting(true)
    setError(null)
    try {
      // Count first
      const { count } = await supabase
        .from('eventmaster_main')
        .select('*', { count: 'exact', head: true })
        .eq('Convocatoria', selected)

      const { error: delErr } = await supabase
        .from('eventmaster_main')
        .delete()
        .eq('Convocatoria', selected)

      if (delErr) throw delErr
      setDeletedCount(count ?? 0)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al borrar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-md animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Borrar Convocatoria</h2>
              <p className="text-white/40 text-xs">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!done ? (
            <>
              {/* Selector */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">
                  Convocatoria a borrar
                </label>
                <select
                  value={selected}
                  onChange={e => { setSelected(e.target.value); setConfirmed(false) }}
                  className="input-field text-sm"
                >
                  <option value="">— Selecciona una convocatoria —</option>
                  {convocatorias.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Warning */}
              {selected && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-300 text-sm font-medium">
                        Se borrarán TODOS los eventos de &ldquo;{selected}&rdquo;
                      </p>
                      <p className="text-red-400/70 text-xs mt-1">
                        Esta operación eliminará permanentemente todos los registros asociados a esta convocatoria de la base de datos.
                      </p>
                    </div>
                  </div>

                  {/* Confirmation checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setConfirmed(v => !v)}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        confirmed
                          ? 'bg-red-500 border-red-500'
                          : 'border-red-500/40 group-hover:border-red-400'
                      )}
                    >
                      {confirmed && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-red-300 text-sm">
                      Entiendo que esta acción es irreversible
                    </span>
                  </label>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white/80 font-medium">Convocatoria eliminada</p>
              <p className="text-white/40 text-sm">
                Se eliminaron {deletedCount} evento{deletedCount !== 1 ? 's' : ''} de &ldquo;{selected}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={done ? () => { onSuccess(); onClose() } : onClose} className="btn-secondary flex-1">
            {done ? 'Cerrar' : 'Cancelar'}
          </button>
          {!done && (
            <button
              onClick={handleDelete}
              disabled={!selected || !confirmed || deleting}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Borrando...</>
                : <><Trash2 className="w-4 h-4" /> Borrar convocatoria</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
