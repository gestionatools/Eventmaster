'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Calendar, CalendarDays,
  Check, RefreshCw, MapPin, FileSpreadsheet, Upload, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── FIN template ─────────────────────────────────────────────────────────────
export interface FINTemplateDef {
  id: string
  actividad: string
  horainicio: string
  horafin: string
}

export const FIN_TEMPLATE_EVENTS: FINTemplateDef[] = [
  { id: 'fin-01', actividad: 'Presentación del programa onboarding',                                 horainicio: '13:00', horafin: '14:30' },
  { id: 'fin-02', actividad: 'Introducción al PAC.',                                                 horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-03', actividad: 'Qué es un ayuntamiento. Breve historia de Gestiona.',                  horainicio: '9:30',  horafin: '11:00' },
  { id: 'fin-04', actividad: 'Dinámicas Gestiona 360',                                               horainicio: '11:00', horafin: '13:00' },
  { id: 'fin-05', actividad: 'Formación esPublico',                                                  horainicio: '13:00', horafin: '14:30' },
  { id: 'fin-06', actividad: 'Ratificaciones y entrega demos',                                       horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-07', actividad: 'Gestiona. Visión General y Página de inicio.',                         horainicio: '9:30',  horafin: '11:00' },
  { id: 'fin-08', actividad: 'Sede electrónica. Portal de transparencia y tablón de anuncios',       horainicio: '11:00', horafin: '13:00' },
  { id: 'fin-09', actividad: 'Terceros. Módulo de Registro y OAMR',                                 horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-10', actividad: 'Metodología de implantación registro',                                 horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-11', actividad: 'Exposición implantación registro',                                     horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-12', actividad: 'Módulo de Expedientes y libros oficiales',                             horainicio: '9:30',  horafin: '12:00' },
  { id: 'fin-13', actividad: 'Metodología de implantación tramitación libre',                        horainicio: '12:00', horafin: '13:30' },
  { id: 'fin-14', actividad: 'Exposición implantación tramitación libre',                            horainicio: '8:00',  horafin: '9:30'  },
  { id: 'fin-15', actividad: 'Configuración general de Gestiona. Usuarios, grupos y permisos.',      horainicio: '9:30',  horafin: '11:30' },
  { id: 'fin-16', actividad: 'Requisitos técnicos. Gestiona envía y APP móvil',                     horainicio: '11:30', horafin: '13:00' },
  { id: 'fin-17', actividad: 'Fuentes de información del equipo de medios',                          horainicio: '13:00', horafin: '15:00' },
  { id: 'fin-18', actividad: 'Estrategias AGE-AOC. Procesos de alta',                               horainicio: '9:00',  horafin: '11:00' },
  { id: 'fin-19', actividad: 'Teoría y conceptos del circuito de resolución en Gestiona (Genérico)', horainicio: '12:00', horafin: '15:00' },
  { id: 'fin-20', actividad: 'Libros oficiales y órganos colegiados',                               horainicio: '9:30',  horafin: '12:30' },
  { id: 'fin-21', actividad: 'Presentación catálogo',                                               horainicio: '12:30', horafin: '14:00' },
  { id: 'fin-22', actividad: 'Taller creación de procedimientos',                                    horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-23', actividad: 'Presentación trámites externos',                                      horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-24', actividad: 'Taller Trámites externos',                                             horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-25', actividad: 'Exposición Órganos colegiados',                                       horainicio: '12:00', horafin: '14:00' },
  { id: 'fin-26', actividad: 'Teoría y conceptos de la fiscalización de expedientes con gasto',      horainicio: '8:00',  horafin: '10:00' },
  { id: 'fin-27', actividad: 'Proceso de bienvenida',                                               horainicio: '10:30', horafin: '12:30' },
  { id: 'fin-28', actividad: 'Taller Circuitos de resolución con fiscalización Genéricos',           horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-29', actividad: 'Exposición CR con Fiscalización Genéricos',                            horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-30', actividad: 'Gestión de clientes',                                                 horainicio: '12:30', horafin: '14:30' },
  { id: 'fin-31', actividad: 'Metodología de implantación',                                         horainicio: '8:00',  horafin: '11:00' },
  { id: 'fin-32', actividad: 'Dinámicas de Gestor',                                                 horainicio: '11:00', horafin: '12:30' },
  { id: 'fin-33', actividad: 'Factura electrónica',                                                 horainicio: '12:30', horafin: '14:30' },
  { id: 'fin-34', actividad: 'Exposición Gestión de clientes',                                      horainicio: '9:00',  horafin: '10:30' },
  { id: 'fin-35', actividad: 'Exposición metodología de implantación',                              horainicio: '11:30', horafin: '13:00' },
  { id: 'fin-36', actividad: 'Búsquedas avanzadas',                                                 horainicio: '8:00',  horafin: '10:00' },
  { id: 'fin-37', actividad: 'Gestdata',                                                            horainicio: '10:00', horafin: '12:00' },
  { id: 'fin-38', actividad: 'Preparación training',                                                horainicio: '12:00', horafin: '15:00' },
  { id: 'fin-39', actividad: 'TE avanzados. Markdown (condicionales y calculados)',                 horainicio: '8:00',  horafin: '12:00' },
  { id: 'fin-40', actividad: 'Presentación archivo',                                                horainicio: '12:00', horafin: '13:30' },
  { id: 'fin-41', actividad: 'Taller archivo',                                                      horainicio: '13:30', horafin: '15:00' },
  { id: 'fin-42', actividad: 'CR sin gasto Avanzados',                                              horainicio: '8:00',  horafin: '10:30' },
  { id: 'fin-43', actividad: 'Exposición CR con Fiscalización Genéricos',                            horainicio: '12:00', horafin: '13:30' },
  { id: 'fin-44', actividad: 'Control interno. Refuerzo teoría.',                                   horainicio: '13:30', horafin: '14:30' },
  { id: 'fin-45', actividad: 'CR con gasto Avanzado',                                               horainicio: '8:00',  horafin: '10:30' },
  { id: 'fin-46', actividad: 'Exposición CR con gasto Avanzado',                                    horainicio: '12:30', horafin: '14:30' },
  { id: 'fin-47', actividad: 'RPA',                                                                 horainicio: '8:00',  horafin: '10:00' },
  { id: 'fin-48', actividad: 'Integraciones backoffice y proyectos técnicos',                       horainicio: '10:00', horafin: '11:30' },
  { id: 'fin-49', actividad: 'Tramitación reglada',                                                 horainicio: '11:30', horafin: '15:00' },
  { id: 'fin-50', actividad: 'Actos plurales',                                                      horainicio: '8:00',  horafin: '11:30' },
  { id: 'fin-51', actividad: 'Refuerzo viajes',                                                     horainicio: '11:30', horafin: ''      },
]

// ─── FIN fields for Excel import ──────────────────────────────────────────────
const FIN_FIELDS = ['fecha', 'horainicio', 'horafin', 'convocatoria', 'tipo'] as const
type FINField = typeof FIN_FIELDS[number]

const FIN_FIELD_LABELS: Record<FINField, string> = {
  fecha:        'Fecha',
  horainicio:   'Hora inicio',
  horafin:      'Hora fin',
  convocatoria: 'Convocatoria',
  tipo:         'Tipo / Actividad',
}

function autoDetectFINField(colName: string): FINField | '' {
  const s = colName.toLowerCase().trim()
  const aliases: [string[], FINField][] = [
    [['fecha', 'date', 'día', 'dia', 'day', 'fec'], 'fecha'],
    [['horainicio', 'hora inicio', 'hora_inicio', 'start', 'inicio', 'from', 'start time', 'horaini'], 'horainicio'],
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS_ES = ['L','M','X','J','V','S','D']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void
  onSuccess: () => void
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function CreateFINEventModal({ onClose, onSuccess }: Props) {
  // ── Calendar mode state ─────────────────────────────────────────────────────
  const [mode, setMode]               = useState<'calendar' | 'excel'>('calendar')
  const [convName, setConvName]       = useState('')
  const [viewMode, setViewMode]       = useState<'month' | 'year'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedId, setSelectedId]   = useState<string>(FIN_TEMPLATE_EVENTS[0].id)
  const [eventDates, setEventDates]   = useState<Record<string, string>>({})
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

  // ── Excel mode state ────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging]       = useState(false)
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows]       = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, FINField | ''>>({})
  const [importStep, setImportStep]       = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload')
  const [importError, setImportError]     = useState<string | null>(null)
  const [importCount, setImportCount]     = useState(0)

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const goBack = () => {
    const d = new Date(currentDate)
    viewMode === 'year' ? d.setFullYear(year - 1) : d.setMonth(month - 1)
    setCurrentDate(d)
  }
  const goForward = () => {
    const d = new Date(currentDate)
    viewMode === 'year' ? d.setFullYear(year + 1) : d.setMonth(month + 1)
    setCurrentDate(d)
  }

  // Map of ISO date → list of FIN event IDs assigned to that date
  const assignedDateMap = useMemo(() => {
    const map = new Map<string, string[]>()
    Object.entries(eventDates).forEach(([id, date]) => {
      if (!date) return
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(id)
    })
    return map
  }, [eventDates])

  const handleDayClick = (date: Date) => {
    if (!selectedId) return
    const iso = toISO(date)
    const newDates = { ...eventDates, [selectedId]: iso }
    setEventDates(newDates)
    // Auto-advance to next unassigned activity
    const next = FIN_TEMPLATE_EVENTS.find(e => e.id !== selectedId && !newDates[e.id])
    if (next) setSelectedId(next.id)
  }

  const removeDate = (id: string) => {
    setEventDates(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const assignedCount = Object.values(eventDates).filter(Boolean).length

  // ── Calendar save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!convName.trim()) { setSaveError('Introduce un nombre para la convocatoria FIN'); return }
    const toInsert = FIN_TEMPLATE_EVENTS.filter(ev => !!eventDates[ev.id])
    if (!toInsert.length) { setSaveError('Asigna al menos una fecha a un evento'); return }

    setSaving(true)
    setSaveError(null)
    try {
      const pad = (n: number) => String(n).padStart(2, '0')
      const rows = toInsert.map(ev => {
        const [y, m, d] = eventDates[ev.id].split('-').map(Number)
        return {
          fecha:        `${y}-${pad(m)}-${pad(d)}T00:00:00+00:00`,
          horainicio:   ev.horainicio || null,
          horafin:      ev.horafin   || null,
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
          if (field && row[col] !== undefined) record[field] = row[col] || null
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

  const selectedEvent = FIN_TEMPLATE_EVENTS.find(e => e.id === selectedId)

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-7xl mx-4 my-4 flex flex-col overflow-hidden rounded-2xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-shrink-0">
          {/* FIN diamond icon */}
          <span
            className="w-4 h-4 bg-yellow-400 flex-shrink-0"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
          <h2 className="text-white font-semibold text-base whitespace-nowrap">Nueva Convocatoria FIN</h2>

          <input
            type="text"
            placeholder="Nombre de la convocatoria FIN..."
            value={convName}
            onChange={e => setConvName(e.target.value)}
            className="input-field text-sm py-1.5 w-72 flex-shrink-0"
          />

          <div className="flex-1" />

          {/* Mode toggle */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1 flex-shrink-0">
            <button
              onClick={() => setMode('calendar')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                mode === 'calendar' ? 'bg-yellow-500/30 text-yellow-300' : 'text-white/40 hover:text-white/70')}
            >
              <Calendar className="w-3.5 h-3.5" /> Plantilla
            </button>
            <button
              onClick={() => setMode('excel')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                mode === 'excel' ? 'bg-yellow-500/30 text-yellow-300' : 'text-white/40 hover:text-white/70')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel / CSV
            </button>
          </div>

          {/* Calendar view toggle (only in calendar mode) */}
          {mode === 'calendar' && (
            <>
              <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1 flex-shrink-0">
                <button
                  onClick={() => setViewMode('month')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                    viewMode === 'month' ? 'bg-brand-500/30 text-brand-300' : 'text-white/40 hover:text-white/70')}
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Mes
                </button>
                <button
                  onClick={() => setViewMode('year')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                    viewMode === 'year' ? 'bg-brand-500/30 text-brand-300' : 'text-white/40 hover:text-white/70')}
                >
                  <Calendar className="w-3.5 h-3.5" /> Año
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white/80 text-sm font-medium min-w-[9rem] text-center">
                  {viewMode === 'year' ? year : `${MONTHS_ES[month]} ${year}`}
                </span>
                <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all ml-1 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            BODY — CALENDAR MODE
        ════════════════════════════════════════════════════════════════ */}
        {mode === 'calendar' && (
          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* Calendar area */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === 'month' ? (
                <FINMonthGrid
                  year={year}
                  month={month}
                  assignedDateMap={assignedDateMap}
                  selectedId={selectedId}
                  eventDates={eventDates}
                  onDayClick={handleDayClick}
                />
              ) : (
                <FINYearGrid
                  year={year}
                  assignedDateMap={assignedDateMap}
                  selectedId={selectedId}
                  eventDates={eventDates}
                  onDayClick={handleDayClick}
                />
              )}
            </div>

            {/* Sidebar — activity list */}
            <div className="w-72 border-l border-white/10 flex flex-col flex-shrink-0 overflow-hidden">
              {/* Sidebar header */}
              <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wider">Actividades FIN</span>
                  <span className="text-white/40 text-xs">{assignedCount}/{FIN_TEMPLATE_EVENTS.length}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                    style={{ width: `${(assignedCount / FIN_TEMPLATE_EVENTS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Activity list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {FIN_TEMPLATE_EVENTS.map(ev => {
                  const assigned   = eventDates[ev.id]
                  const isSelected = selectedId === ev.id
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedId(ev.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-start gap-2 border',
                        isSelected
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          : assigned
                          ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/8'
                          : 'bg-transparent text-white/35 border-transparent hover:bg-white/5 hover:text-white/55'
                      )}
                    >
                      {/* Status dot */}
                      <span className={cn(
                        'w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                        assigned
                          ? 'bg-yellow-500'
                          : isSelected
                          ? 'ring-2 ring-yellow-400 bg-yellow-500/30 animate-pulse'
                          : 'bg-white/10'
                      )}>
                        {assigned && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium leading-tight">{ev.actividad}</div>
                        <div className="text-[10px] opacity-50 mt-0.5 font-mono">
                          {ev.horainicio}{ev.horafin ? ` – ${ev.horafin}` : ''}
                        </div>
                        {assigned && (
                          <div className="text-[10px] text-yellow-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {(() => {
                              const d = new Date(assigned + 'T00:00:00')
                              return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
                            })()}
                          </div>
                        )}
                      </div>

                      {assigned && (
                        <button
                          onClick={e => { e.stopPropagation(); removeDate(ev.id) }}
                          className="flex-shrink-0 mt-0.5 text-white/20 hover:text-red-400 transition-colors"
                          title="Quitar fecha"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BODY — EXCEL / CSV MODE
        ════════════════════════════════════════════════════════════════ */}
        {mode === 'excel' && (
          <div className="flex-1 overflow-y-auto p-5">

            {importStep === 'upload' && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelected(f) }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all',
                  isDragging ? 'border-yellow-400/60 bg-yellow-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                )}
              >
                <FileSpreadsheet className={cn('w-14 h-14', isDragging ? 'text-yellow-400' : 'text-white/20')} />
                <div className="text-center">
                  <p className="text-white/70 text-sm font-medium">Arrastra tu archivo aquí</p>
                  <p className="text-white/30 text-xs mt-1">o haz clic para seleccionar</p>
                  <p className="text-white/20 text-xs mt-2">.xlsx · .xls · .csv</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
              </div>
            )}

            {importStep === 'mapping' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Confirmar mapeo de columnas</p>
                    <p className="text-white/40 text-xs mt-0.5">{parsedRows.length} filas detectadas</p>
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
                    <div key={header} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-white/70 text-sm font-medium truncate block">{header}</span>
                        <span className="text-white/25 text-xs">
                          {parsedRows[0]?.[header] ? `Ej: "${String(parsedRows[0][header]).slice(0, 40)}"` : 'Sin datos de muestra'}
                        </span>
                      </div>
                      <span className="text-white/20 text-sm flex-shrink-0">→</span>
                      <select
                        value={columnMapping[header] ?? ''}
                        onChange={e => setColumnMapping(prev => ({ ...prev, [header]: e.target.value as FINField | '' }))}
                        className="input-field text-xs py-1.5 w-48 flex-shrink-0"
                      >
                        <option value="">— No asignar —</option>
                        {FIN_FIELDS.map(f => <option key={f} value={f}>{FIN_FIELD_LABELS[f]}</option>)}
                      </select>
                      {columnMapping[header] && <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importStep === 'importing' && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <RefreshCw className="w-10 h-10 text-yellow-400 animate-spin" />
                <p className="text-white/60 text-sm">Importando datos FIN...</p>
              </div>
            )}

            {importStep === 'done' && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-base font-medium">¡Importación completada!</p>
                  <p className="text-white/40 text-sm mt-1">{importCount} evento{importCount !== 1 ? 's' : ''} FIN importado{importCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {importError && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2 max-w-2xl mx-auto">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {importError}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-white/10 flex-shrink-0">
          {mode === 'calendar' ? (
            <>
              {saveError ? (
                <p className="text-red-400 text-sm">{saveError}</p>
              ) : (
                <p className="text-white/30 text-xs truncate flex-1">
                  {selectedEvent
                    ? `Haz clic en un día para asignar: ${selectedEvent.actividad}`
                    : 'Selecciona una actividad de la lista'}
                </p>
              )}
              <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
                <button
                  onClick={handleSave}
                  disabled={saving || !convName.trim() || assignedCount === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Crear convocatoria FIN
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1" />
              {importStep === 'done' ? (
                <button
                  onClick={() => { onSuccess(); onClose() }}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all"
                >
                  <Check className="w-4 h-4" /> Cerrar y actualizar
                </button>
              ) : (
                <>
                  <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
                  {importStep === 'mapping' && (
                    <button
                      onClick={handleImport}
                      disabled={!Object.values(columnMapping).some(Boolean)}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" /> Importar {parsedRows.length} filas
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Month grid ───────────────────────────────────────────────────────────────
function FINMonthGrid({
  year, month, assignedDateMap, selectedId, eventDates, onDayClick,
}: {
  year: number
  month: number
  assignedDateMap: Map<string, string[]>
  selectedId: string
  eventDates: Record<string, string>
  onDayClick: (d: Date) => void
}) {
  const today     = new Date()
  const firstDay  = new Date(year, month, 1)
  const startOff  = (firstDay.getDay() + 6) % 7
  const daysInMo  = new Date(year, month + 1, 0).getDate()
  const selectedAssigned = eventDates[selectedId]

  const cells: (number | null)[] = [
    ...Array(startOff).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="text-center text-xs text-white/25 py-1 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const date     = new Date(year, month, day)
          const iso      = toISO(date)
          const assigned = assignedDateMap.get(iso) ?? []
          const isToday  = date.toDateString() === today.toDateString()
          const isTarget = selectedAssigned === iso

          return (
            <button
              key={i}
              onClick={() => onDayClick(date)}
              className={cn(
                'h-16 rounded-lg p-1.5 flex flex-col items-center transition-all border group',
                isTarget
                  ? 'bg-yellow-500/25 border-yellow-400/50 shadow-[0_0_0_2px_rgba(234,179,8,0.3)]'
                  : assigned.length > 0
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : isToday
                  ? 'bg-brand-500/20 border-brand-500/30'
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/8 hover:border-yellow-500/30'
              )}
            >
              <span className={cn(
                'text-sm font-medium leading-none',
                isTarget ? 'text-yellow-300' : isToday ? 'text-brand-300' : 'text-white/70 group-hover:text-white/90'
              )}>
                {day}
              </span>
              {/* Assigned activity labels */}
              {assigned.length > 0 && (
                <div className="w-full mt-auto space-y-px">
                  {assigned.slice(0, 2).map(id => {
                    const ev = FIN_TEMPLATE_EVENTS.find(e => e.id === id)
                    if (!ev) return null
                    // Short label: first word(s), max ~10 chars
                    const label = ev.actividad.split(' ').slice(0, 2).join(' ')
                    return (
                      <div key={id} className="text-[8px] text-yellow-300 truncate text-center leading-tight bg-yellow-500/20 rounded px-0.5">
                        {label}
                      </div>
                    )
                  })}
                  {assigned.length > 2 && (
                    <div className="text-[8px] text-yellow-400/60 text-center">+{assigned.length - 2}</div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Year grid ────────────────────────────────────────────────────────────────
function FINYearGrid({
  year, assignedDateMap, selectedId, eventDates, onDayClick,
}: {
  year: number
  assignedDateMap: Map<string, string[]>
  selectedId: string
  eventDates: Record<string, string>
  onDayClick: (d: Date) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, mi) => (
        <FINMiniMonthGrid
          key={mi}
          year={year}
          month={mi}
          assignedDateMap={assignedDateMap}
          selectedId={selectedId}
          eventDates={eventDates}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  )
}

// ─── Mini-month for year view ─────────────────────────────────────────────────
function FINMiniMonthGrid({
  year, month, assignedDateMap, selectedId, eventDates, onDayClick,
}: {
  year: number
  month: number
  assignedDateMap: Map<string, string[]>
  selectedId: string
  eventDates: Record<string, string>
  onDayClick: (d: Date) => void
}) {
  const today    = new Date()
  const firstDay = new Date(year, month, 1)
  const startOff = (firstDay.getDay() + 6) % 7
  const daysInMo = new Date(year, month + 1, 0).getDate()
  const selectedAssigned = eventDates[selectedId]

  const cells: (number | null)[] = [
    ...Array(startOff).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/8">
      <h3 className="text-white/60 text-xs font-medium text-center mb-2">{MONTHS_ES[month]}</h3>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="text-center text-[9px] text-white/20 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />
          const date     = new Date(year, month, day)
          const iso      = toISO(date)
          const assigned = assignedDateMap.get(iso) ?? []
          const isToday  = date.toDateString() === today.toDateString()
          const isTarget = selectedAssigned === iso

          return (
            <button
              key={i}
              onClick={() => onDayClick(date)}
              title={`${day} ${MONTHS_ES[month]} ${year}`}
              className={cn(
                'aspect-square rounded flex items-center justify-center text-[10px] font-medium transition-all relative',
                isTarget
                  ? 'bg-yellow-500/40 text-yellow-200 ring-1 ring-yellow-400'
                  : assigned.length > 0
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : isToday
                  ? 'bg-brand-500/30 text-brand-300'
                  : 'text-white/35 hover:bg-white/8 hover:text-white/70'
              )}
            >
              {day}
              {assigned.length > 0 && (
                <span className="absolute bottom-0 right-0 w-1 h-1 rounded-full bg-yellow-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
