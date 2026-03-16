'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  X, Plus, Upload, RefreshCw, FileSpreadsheet, Check, AlertTriangle,
  Calendar, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── FIN field definitions ────────────────────────────────────────────────────
const FIN_FIELDS = ['fecha', 'horainicio', 'horafin', 'convocatoria', 'tipo'] as const
type FINField = typeof FIN_FIELDS[number]

const FIN_FIELD_LABELS: Record<FINField, string> = {
  fecha: 'Fecha',
  horainicio: 'Hora inicio',
  horafin: 'Hora fin',
  convocatoria: 'Convocatoria',
  tipo: 'Tipo',
}

function autoDetectFINField(colName: string): FINField | '' {
  const s = colName.toLowerCase().trim()
  const aliases: [string[], FINField][] = [
    [['fecha', 'date', 'día', 'dia', 'day', 'fec'], 'fecha'],
    [['horainicio', 'hora inicio', 'hora_inicio', 'start', 'inicio', 'from', 'start time', 'horaini', 'hora ini'], 'horainicio'],
    [['horafin', 'hora fin', 'hora_fin', 'end', 'fin', 'to', 'end time', 'hora fin', 'hora_fin'], 'horafin'],
    [['convocatoria', 'call', 'programa', 'convoc', 'nombre', 'name'], 'convocatoria'],
    [['tipo', 'type', 'modalidad', 'formato', 'format'], 'tipo'],
  ]
  for (const [keys, field] of aliases) {
    if (keys.some(k => s === k || s.includes(k))) return field
  }
  return ''
}

// ─── CSV / Excel parser ───────────────────────────────────────────────────────
async function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  if (file.name.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (!lines.length) return { headers: [], rows: [] }
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let cur = '', inQ = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') { inQ = !inQ }
        else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
        else cur += ch
      }
      result.push(cur.trim())
      return result
    }
    const headers = parseCSVLine(lines[0])
    const rows = lines.slice(1).map(line => {
      const vals = parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return row
    })
    return { headers, rows }
  }

  try {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const arr = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][]
    if (!arr.length) return { headers: [], rows: [] }
    const headers = (arr[0] as unknown[]).map(h => String(h ?? '').trim())
    const rows = arr.slice(1).map(rowArr => {
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = String((rowArr as unknown[])[i] ?? '') })
      return row
    })
    return { headers, rows }
  } catch {
    throw new Error('No se pudo leer el archivo Excel. Usa CSV o instala las dependencias (npm install).')
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const DAYS_ES = ['L','M','X','J','V','S','D']

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void
  onSuccess: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateFINEventModal({ onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'excel'>('calendar')

  // ── Calendar tab state ──────────────────────────────────────────────────────
  const [calDate, setCalDate]           = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [convocatoria, setConvocatoria] = useState('')
  const [horainicio, setHorainicio]     = useState('')
  const [horafin, setHorafin]           = useState('')
  const [tipo, setTipo]                 = useState('')
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)

  // ── Excel tab state ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging]     = useState(false)
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows]     = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, FINField | ''>>({})
  const [importStep, setImportStep]     = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload')
  const [importError, setImportError]   = useState<string | null>(null)
  const [importCount, setImportCount]   = useState(0)

  // ── Calendar navigation ─────────────────────────────────────────────────────
  const calYear  = calDate.getFullYear()
  const calMonth = calDate.getMonth()
  const today    = new Date()

  const goPrevMonth = () => {
    const d = new Date(calDate); d.setMonth(calMonth - 1); setCalDate(d)
  }
  const goNextMonth = () => {
    const d = new Date(calDate); d.setMonth(calMonth + 1); setCalDate(d)
  }

  // ── Calendar save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedDate) { setSaveError('Selecciona una fecha en el calendario'); return }
    setSaving(true)
    setSaveError(null)
    try {
      const pad  = (n: number) => String(n).padStart(2, '0')
      const isoFecha = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T00:00:00+00:00`
      const { error } = await supabase.from('events_FIN').insert([{
        fecha:        isoFecha,
        horainicio:   horainicio || null,
        horafin:      horafin   || null,
        convocatoria: convocatoria || null,
        tipo:         tipo         || null,
      }])
      if (error) throw error
      onSuccess()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── File handling ───────────────────────────────────────────────────────────
  const handleFileSelected = useCallback(async (file: File) => {
    setImportError(null)
    setImportStep('mapping')
    try {
      const { headers, rows } = await parseFile(file)
      setParsedHeaders(headers)
      setParsedRows(rows)
      const mapping: Record<string, FINField | ''> = {}
      headers.forEach(h => { mapping[h] = autoDetectFINField(h) })
      setColumnMapping(mapping)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al procesar el archivo')
      setImportStep('upload')
    }
  }, [])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelected(file)
  }, [handleFileSelected])

  const handleImport = async () => {
    setImportStep('importing')
    setImportError(null)
    try {
      const rows = parsedRows.map(row => {
        const record: Record<string, string | null> = {}
        Object.entries(columnMapping).forEach(([col, field]) => {
          if (field && row[col] !== undefined) {
            record[field] = row[col] || null
          }
        })
        return record
      }).filter(r => Object.keys(r).length > 0 && Object.values(r).some(v => v !== null))

      if (!rows.length) throw new Error('No hay filas válidas para importar')

      const CHUNK = 500
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await supabase.from('events_FIN').insert(rows.slice(i, i + CHUNK))
        if (error) throw error
      }
      setImportCount(rows.length)
      setImportStep('done')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar')
      setImportStep('mapping')
    }
  }

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const firstDay   = new Date(calYear, calMonth, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-2xl max-h-[92vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <span
                className="w-4 h-4 bg-yellow-400 inline-block"
                style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
              />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Crear Convocatoria FIN</h2>
              <p className="text-white/40 text-xs">Formación Interna · acrónimo FIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'calendar'
                ? 'text-yellow-300 border-b-2 border-yellow-400 bg-yellow-500/5'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Calendar className="w-4 h-4" /> Crear convocatoria
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'excel'
                ? 'text-yellow-300 border-b-2 border-yellow-400 bg-yellow-500/5'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <FileSpreadsheet className="w-4 h-4" /> Cargar desde Excel / CSV
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB: CALENDAR
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'calendar' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Mini calendar */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button onClick={goPrevMonth} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white/80 text-sm font-semibold">
                    {MONTHS_ES[calMonth]} {calYear}
                  </span>
                  <button onClick={goNextMonth} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS_ES.map(d => (
                    <div key={d} className="text-white/25 text-[10px] text-center font-semibold uppercase">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: totalCells }, (_, i) => {
                    const dayNum = i - startOffset + 1
                    if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />
                    const date       = new Date(calYear, calMonth, dayNum)
                    const isToday    = sameDay(date, today)
                    const isSelected = selectedDate ? sameDay(date, selectedDate) : false
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'aspect-square rounded-lg flex items-center justify-center text-xs transition-all hover:bg-yellow-500/20',
                          isSelected
                            ? 'bg-yellow-500/40 text-yellow-200 font-bold ring-1 ring-yellow-400/60'
                            : isToday
                              ? 'bg-brand-500/30 text-brand-300 font-semibold'
                              : 'text-white/60 hover:text-white'
                        )}
                      >
                        {dayNum}
                      </button>
                    )
                  })}
                </div>

                {selectedDate && (
                  <p className="text-yellow-400/70 text-xs text-center mt-3">
                    Seleccionado: {selectedDate.getDate()} de {MONTHS_ES[selectedDate.getMonth()]} de {selectedDate.getFullYear()}
                  </p>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs mb-1.5 flex items-center gap-1.5">
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
                  <label className="text-white/40 text-xs mb-1.5 flex items-center gap-1.5">
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

              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Convocatoria</label>
                <input
                  type="text"
                  value={convocatoria}
                  onChange={e => setConvocatoria(e.target.value)}
                  placeholder="Nombre de la convocatoria FIN"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Tipo</label>
                <input
                  type="text"
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  placeholder="Tipo de formación"
                  className="input-field text-sm"
                />
              </div>

              {saveError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-white/10 p-5 flex justify-end gap-3">
              <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedDate}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
              >
                {saving
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
                  : <><Plus className="w-4 h-4" /> Crear evento FIN</>
                }
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: EXCEL / CSV
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'excel' && (
          <>
            <div className="flex-1 overflow-y-auto p-5">

              {/* STEP: Upload */}
              {importStep === 'upload' && (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all',
                    isDragging
                      ? 'border-yellow-400/60 bg-yellow-500/10'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  )}
                >
                  <FileSpreadsheet className={cn('w-12 h-12', isDragging ? 'text-yellow-400' : 'text-white/20')} />
                  <div className="text-center">
                    <p className="text-white/70 text-sm font-medium">Arrastra tu archivo aquí</p>
                    <p className="text-white/30 text-xs mt-1">o haz clic para seleccionar</p>
                    <p className="text-white/20 text-xs mt-2">.xlsx · .xls · .csv</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  />
                </div>
              )}

              {/* STEP: Column mapping */}
              {importStep === 'mapping' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Confirmar mapeo de columnas</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {parsedRows.length} filas detectadas · Ajusta las correspondencias si es necesario
                      </p>
                    </div>
                    <button
                      onClick={() => { setImportStep('upload'); setParsedHeaders([]); setParsedRows([]) }}
                      className="text-xs text-white/40 hover:text-white/70 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {parsedHeaders.map(header => (
                      <div
                        key={header}
                        className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-white/70 text-sm font-medium truncate block">{header}</span>
                          <span className="text-white/25 text-xs">
                            {parsedRows[0]?.[header]
                              ? `Ej: "${String(parsedRows[0][header]).slice(0, 40)}"`
                              : 'Sin datos de muestra'}
                          </span>
                        </div>
                        <span className="text-white/20 text-sm flex-shrink-0">→</span>
                        <select
                          value={columnMapping[header] ?? ''}
                          onChange={e =>
                            setColumnMapping(prev => ({ ...prev, [header]: e.target.value as FINField | '' }))
                          }
                          className="input-field text-xs py-1.5 w-44 flex-shrink-0"
                        >
                          <option value="">— No asignar —</option>
                          {FIN_FIELDS.map(f => (
                            <option key={f} value={f}>{FIN_FIELD_LABELS[f]}</option>
                          ))}
                        </select>
                        {columnMapping[header] && (
                          <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: Importing */}
              {importStep === 'importing' && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <RefreshCw className="w-10 h-10 text-yellow-400 animate-spin" />
                  <p className="text-white/60 text-sm">Importando datos FIN...</p>
                </div>
              )}

              {/* STEP: Done */}
              {importStep === 'done' && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-base font-medium">¡Importación completada!</p>
                    <p className="text-white/40 text-sm mt-1">
                      {importCount} evento{importCount !== 1 ? 's' : ''} FIN importado{importCount !== 1 ? 's' : ''} correctamente
                    </p>
                  </div>
                </div>
              )}

              {importError && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {importError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-white/10 p-5 flex justify-end gap-3">
              {importStep === 'done' ? (
                <button
                  onClick={() => { onSuccess(); onClose() }}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all"
                >
                  <Check className="w-4 h-4" /> Cerrar y actualizar
                </button>
              ) : (
                <>
                  <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
                    Cancelar
                  </button>
                  {importStep === 'mapping' && (
                    <button
                      onClick={handleImport}
                      disabled={!Object.values(columnMapping).some(Boolean)}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Importar {parsedRows.length} filas
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
