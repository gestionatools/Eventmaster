'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  X, Plus, Upload, RefreshCw, FileSpreadsheet, Check, AlertTriangle, Calendar,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── FIN template events ──────────────────────────────────────────────────────
interface FINTemplateDef {
  id: string
  actividad: string
  horainicio: string
  horafin: string
}

export const FIN_TEMPLATE_EVENTS: FINTemplateDef[] = [
  { id: 'fin-01', actividad: 'Presentación del programa onboarding',                                        horainicio: '13:00', horafin: '14:30' },
  { id: 'fin-02', actividad: 'Introducción al PAC.',                                                        horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-03', actividad: 'Qué es un ayuntamiento. Breve historia de Gestiona.',                         horainicio: '9:30',  horafin: '11:00' },
  { id: 'fin-04', actividad: 'Dinámicas Gestiona 360',                                                      horainicio: '11:00', horafin: '13:00' },
  { id: 'fin-05', actividad: 'Formación esPublico',                                                         horainicio: '13:00', horafin: '14:30' },
  { id: 'fin-06', actividad: 'Ratificaciones y entrega demos',                                              horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-07', actividad: 'Gestiona. Visión General y Página de inicio.',                                horainicio: '9:30',  horafin: '11:00' },
  { id: 'fin-08', actividad: 'Sede electrónica. Portal de transparencia y tablón de anuncios',              horainicio: '11:00', horafin: '13:00' },
  { id: 'fin-09', actividad: 'Terceros. Módulo de Registro y OAMR',                                        horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-10', actividad: 'Metodología de implantación registro',                                       horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-11', actividad: 'Exposición implantación registro',                                            horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-12', actividad: 'Módulo de Expedientes y libros oficiales',                                    horainicio: '9:30',  horafin: '12:00' },
  { id: 'fin-13', actividad: 'Metodología de implantación tramitación libre',                               horainicio: '12:00', horafin: '13:30' },
  { id: 'fin-14', actividad: 'Exposición implantación tramitación libre',                                   horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-15', actividad: 'Configuración general de Gestiona. Usuarios, grupos y permisos.',             horainicio: '9:30',  horafin: '11:30' },
  { id: 'fin-16', actividad: 'Requisitos técnicos. Gestiona envía y APP móvil',                            horainicio: '11:30', horafin: '13:00' },
  { id: 'fin-17', actividad: 'Fuentes de información del equipo de medios',                                 horainicio: '13:00', horafin: '15:00' },
  { id: 'fin-18', actividad: 'Estrategias AGE-AOC. Procesos de alta',                                      horainicio: '9:00',  horafin: '11:00' },
  { id: 'fin-19', actividad: 'Teoría y conceptos del circuito de resolución en Gestiona (Genérico)',        horainicio: '12:00', horafin: '15:00' },
  { id: 'fin-20', actividad: 'Libros oficiales y órganos colegiados',                                       horainicio: '9:30',  horafin: '12:30' },
  { id: 'fin-21', actividad: 'Presentación catálogo',                                                       horainicio: '12:30', horafin: '14:00' },
  { id: 'fin-22', actividad: 'Taller creación de procedimientos',                                           horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-23', actividad: 'Presentación trámites externos',                                              horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-24', actividad: 'Taller Trámites externos',                                                    horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-25', actividad: 'Exposición Órganos colegiados',                                               horainicio: '12:00', horafin: '14:00' },
  { id: 'fin-26', actividad: 'Teoría y conceptos de la fiscalización de expedientes con gasto',             horainicio: '8:00',  horafin: '10:00' },
  { id: 'fin-27', actividad: 'Proceso de bienvenida',                                                       horainicio: '10:30', horafin: '12:30' },
  { id: 'fin-28', actividad: 'Taller Circuitos de resolución con fiscalización Genéricos',                  horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-29', actividad: 'Exposición CR con Fiscalización Genéricos',                                   horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-30', actividad: 'Gestión de clientes',                                                         horainicio: '12:30', horafin: '14:30' },
  { id: 'fin-31', actividad: 'Metodología de implantación',                                                 horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-32', actividad: 'Dinámicas de Gestor',                                                         horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-33', actividad: 'Factura electrónica',                                                         horainicio: '12:30', horafin: '14:30' },
  { id: 'fin-34', actividad: 'Exposición Gestión de clientes',                                              horainicio: '9:00',  horafin: '10:30' },
  { id: 'fin-35', actividad: 'Exposición metodología de implantación',                                      horainicio: '11:30', horafin: '13:00' },
  { id: 'fin-36', actividad: 'Búsquedas avanzadas',                                                         horainicio: '8:00',  horafin: '10:00' },
  { id: 'fin-37', actividad: 'Gestdata',                                                                     horainicio: '10:00', horafin: '12:00' },
  { id: 'fin-38', actividad: 'Preparación training',                                                        horainicio: '12:00', horafin: '15:00' },
  { id: 'fin-39', actividad: 'TE avanzados. Markdown (condicionales y calculados)',                         horainicio: '8:00',  horafin: '12:00' },
  { id: 'fin-40', actividad: 'Presentación archivo',                                                        horainicio: '12:00', horafin: '13:30' },
  { id: 'fin-41', actividad: 'Taller archivo',                                                              horainicio: '13:30', horafin: '15:00' },
  { id: 'fin-42', actividad: 'CR sin gasto Avanzados',                                                      horainicio: '8:00',  horafin: '10:30' },
  { id: 'fin-43', actividad: 'Exposición CR con Fiscalización Genéricos',                                   horainicio: '12:00', horafin: '13:30' },
  { id: 'fin-44', actividad: 'Control interno. Refuerzo teoría.',                                            horainicio: '13:30', horafin: '14:30' },
  { id: 'fin-45', actividad: 'CR con gasto Avanzado',                                                       horainicio: '8:00',  horafin: '10:30' },
  { id: 'fin-46', actividad: 'Exposición CR con gasto Avanzado',                                            horainicio: '12:30', horafin: '14:30' },
  { id: 'fin-47', actividad: 'RPA',                                                                         horainicio: '8:00',  horafin: '10:00' },
  { id: 'fin-48', actividad: 'Integraciones backoffice y proyectos técnicos',                               horainicio: '10:00', horafin: '11:30' },
  { id: 'fin-49', actividad: 'Tramitación reglada',                                                         horainicio: '11:30', horafin: '15:00' },
  { id: 'fin-50', actividad: 'Actos plurales',                                                              horainicio: '8:00',  horafin: '11:30' },
  { id: 'fin-51', actividad: 'Refuerzo viajes',                                                             horainicio: '11:30', horafin: ''      },
]

// ─── FIN field definitions (for Excel import) ─────────────────────────────────
const FIN_FIELDS = ['fecha', 'horainicio', 'horafin', 'convocatoria', 'tipo'] as const
type FINField = typeof FIN_FIELDS[number]

const FIN_FIELD_LABELS: Record<FINField, string> = {
  fecha: 'Fecha',
  horainicio: 'Hora inicio',
  horafin: 'Hora fin',
  convocatoria: 'Convocatoria',
  tipo: 'Tipo / Actividad',
}

function autoDetectFINField(colName: string): FINField | '' {
  const s = colName.toLowerCase().trim()
  const aliases: [string[], FINField][] = [
    [['fecha', 'date', 'día', 'dia', 'day', 'fec'], 'fecha'],
    [['horainicio', 'hora inicio', 'hora_inicio', 'start', 'inicio', 'from', 'start time', 'horaini', 'hora ini'], 'horainicio'],
    [['horafin', 'hora fin', 'hora_fin', 'end', 'fin', 'to', 'end time'], 'horafin'],
    [['convocatoria', 'call', 'programa', 'convoc', 'nombre', 'name'], 'convocatoria'],
    [['tipo', 'type', 'modalidad', 'actividad', 'activity', 'format'], 'tipo'],
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

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void
  onSuccess: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreateFINEventModal({ onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<'template' | 'excel'>('template')

  // ── Template tab state ──────────────────────────────────────────────────────
  const [convName, setConvName]       = useState('')
  // eventDates[id] = 'YYYY-MM-DD'
  const [eventDates, setEventDates]   = useState<Record<string, string>>({})
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

  // ── Excel tab state ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging]       = useState(false)
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows]       = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, FINField | ''>>({})
  const [importStep, setImportStep]       = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload')
  const [importError, setImportError]     = useState<string | null>(null)
  const [importCount, setImportCount]     = useState(0)

  const assignedCount = Object.values(eventDates).filter(Boolean).length

  // ── Template save ───────────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!convName.trim()) { setSaveError('Introduce un nombre para la convocatoria FIN'); return }
    const toInsert = FIN_TEMPLATE_EVENTS.filter(ev => !!eventDates[ev.id])
    if (!toInsert.length) { setSaveError('Asigna al menos una fecha a un evento'); return }

    setSaving(true)
    setSaveError(null)
    try {
      const pad = (n: number) => String(n).padStart(2, '0')
      const rows = toInsert.map(ev => {
        const iso = eventDates[ev.id]
        const [y, m, d] = iso.split('-').map(Number)
        const fecha = `${y}-${pad(m)}-${pad(d)}T00:00:00+00:00`
        return {
          fecha,
          horainicio:   ev.horainicio  || null,
          horafin:      ev.horafin     || null,
          convocatoria: convName.trim(),
          tipo:         ev.actividad,
        }
      })

      const CHUNK = 500
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await supabase.from('events_FIN').insert(rows.slice(i, i + CHUNK))
        if (error) throw error
      }
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
              <p className="text-white/40 text-xs">Formación Interna · {FIN_TEMPLATE_EVENTS.length} actividades</p>
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
            onClick={() => setActiveTab('template')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'template'
                ? 'text-yellow-300 border-b-2 border-yellow-400 bg-yellow-500/5'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Calendar className="w-4 h-4" /> Desde Plantilla
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
            TAB: TEMPLATE
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'template' && (
          <>
            {/* Convocatoria name */}
            <div className="p-4 border-b border-white/5 flex-shrink-0">
              <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">
                Nombre de la Convocatoria FIN
              </label>
              <input
                type="text"
                placeholder="Ej: FIN 2026 – Ayuntamiento de..."
                value={convName}
                onChange={e => setConvName(e.target.value)}
                className="input-field text-sm"
                autoFocus
              />
            </div>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {FIN_TEMPLATE_EVENTS.map((ev, idx) => {
                const dateVal  = eventDates[ev.id] ?? ''
                const hasDate  = !!dateVal
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-all',
                      hasDate && 'bg-yellow-500/5'
                    )}
                  >
                    {/* Index + check */}
                    <span className={cn(
                      'w-5 h-5 flex items-center justify-center text-[10px] font-mono flex-shrink-0 rounded',
                      hasDate ? 'text-yellow-300' : 'text-white/20'
                    )}>
                      {hasDate ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </span>

                    {/* Activity name */}
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        'text-xs block truncate',
                        hasDate ? 'text-white/80' : 'text-white/50'
                      )}>
                        {ev.actividad}
                      </span>
                      <span className="text-white/25 text-[10px] font-mono">
                        {ev.horainicio}{ev.horafin ? ` – ${ev.horafin}` : ''}
                      </span>
                    </div>

                    {/* Date input */}
                    <input
                      type="date"
                      value={dateVal}
                      onChange={e =>
                        setEventDates(prev => ({ ...prev, [ev.id]: e.target.value }))
                      }
                      className="input-field text-xs py-1 w-36 flex-shrink-0"
                    />
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-white/10 p-4">
              {saveError && (
                <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 text-white/30 text-xs">
                  {assignedCount} / {FIN_TEMPLATE_EVENTS.length} actividades con fecha asignada
                </div>
                <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving || !convName.trim() || assignedCount === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
                >
                  {saving
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creando...</>
                    : <><Plus className="w-4 h-4" /> Crear convocatoria FIN</>
                  }
                </button>
              </div>
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
                          className="input-field text-xs py-1.5 w-48 flex-shrink-0"
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
