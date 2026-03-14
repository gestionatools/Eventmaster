'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  X, Plus, Upload, RefreshCw, ChevronDown, ChevronRight,
  FileSpreadsheet, Check, AlertTriangle, Calendar
} from 'lucide-react'
import { supabase, EventRow } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── Template data ─────────────────────────────────────────────────────────────
interface TemplateEventDef {
  slotId: string
  Actividad: string
  Sesión: string
  Tipo: string
  'Hora inicio': string
  'Hora fin': string
}

interface DaySlot {
  id: string
  label: string
  suggestedDay: string
}

const DAY_SLOTS: DaySlot[] = [
  { id: 'kickoff1', label: 'KICKOFF – Día 1',     suggestedDay: 'Viernes'   },
  { id: 'kickoff2', label: 'KICKOFF – Día 2',     suggestedDay: 'Lunes'     },
  { id: 's2d1',     label: 'Sesión 2 – Día 1',   suggestedDay: 'Martes'    },
  { id: 's2d2',     label: 'Sesión 2 – Día 2',   suggestedDay: 'Miércoles' },
  { id: 's2d3',     label: 'Sesión 2 – Día 3',   suggestedDay: 'Jueves'    },
  { id: 's2d4',     label: 'Sesión 2 – Día 4',   suggestedDay: 'Viernes'   },
  { id: 's3d1',     label: 'Sesión 3 – Día 1',   suggestedDay: 'Martes'    },
  { id: 's3d2',     label: 'Sesión 3 – Día 2',   suggestedDay: 'Miércoles' },
  { id: 's3d3',     label: 'Sesión 3 – Día 3',   suggestedDay: 'Jueves'    },
  { id: 's3d4',     label: 'Sesión 3 – Día 4',   suggestedDay: 'Viernes'   },
  { id: 'cierre',   label: 'Fecha fin evaluación', suggestedDay: ''         },
]

const TEMPLATE_EVENTS: TemplateEventDef[] = [
  // KICKOFF Día 1
  { slotId: 'kickoff1', Actividad: 'KICKOFF bienvenida / Inicio', Sesión: 'Online', Tipo: 'Online', 'Hora inicio': '10:00', 'Hora fin': '11:30' },
  // KICKOFF Día 2
  { slotId: 'kickoff2', Actividad: 'café bienvenida/demo plataforma formación', Sesión: 'online', Tipo: 'Online', 'Hora inicio': '10:00', 'Hora fin': '11:00' },
  // Sesión 2 – Día 1
  { slotId: 's2d1', Actividad: 'Bienvenida institucional', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '10:00' },
  { slotId: 's2d1', Actividad: 'Taller 1 "Configuración básica de trámites externos y tesauros"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '10:00', 'Hora fin': '11:30' },
  { slotId: 's2d1', Actividad: 'Taller 2 "Gestiona Code"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '12:00', 'Hora fin': '13:30' },
  { slotId: 's2d1', Actividad: 'Formación Expertos grupo esPublico "Migración de datos"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '13:30', 'Hora fin': '14:30' },
  { slotId: 's2d1', Actividad: 'Tour por las instalaciones', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '14:30', 'Hora fin': '' },
  { slotId: 's2d1', Actividad: 'Comida', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '14:30', 'Hora fin': '16:30' },
  { slotId: 's2d1', Actividad: 'Teambuilding', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '16:30', 'Hora fin': '18:30' },
  { slotId: 's2d1', Actividad: 'Cena', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '20:30', 'Hora fin': '' },
  // Sesión 2 – Día 2
  { slotId: 's2d2', Actividad: 'Taller 3 "Construcción de documentos inteligentes"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '10:00' },
  { slotId: 's2d2', Actividad: 'Taller 4 "Circuito de resolución singular"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '10:30', 'Hora fin': '13:00' },
  { slotId: 's2d2', Actividad: 'Formación Expertos grupo esPublico "Arquitectura de interoperabilidad"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '13:00', 'Hora fin': '14:30' },
  { slotId: 's2d2', Actividad: 'Comida', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '14:30', 'Hora fin': '16:30' },
  { slotId: 's2d2', Actividad: 'Taller 5 "Circuito de resolución plural"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '16:30', 'Hora fin': '18:30' },
  // Sesión 2 – Día 3
  { slotId: 's2d3', Actividad: 'Taller 6 "Motor de tramitación Gestiona 360°"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '15:00' },
  { slotId: 's2d3', Actividad: 'Visita cultural', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '18:30', 'Hora fin': '20:30' },
  { slotId: 's2d3', Actividad: 'Cena', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '20:30', 'Hora fin': '' },
  // Sesión 2 – Día 4
  { slotId: 's2d4', Actividad: 'Introducción al módulo de diseño de control interno', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '10:00' },
  { slotId: 's2d4', Actividad: 'Taller 7 "Búsquedas avanzadas de Gestiona"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '10:00', 'Hora fin': '11:00' },
  { slotId: 's2d4', Actividad: 'Formación Expertos grupo esPublico: "Plataforma editorial de esPublico"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '11:30', 'Hora fin': '12:30' },
  { slotId: 's2d4', Actividad: 'Formación Expertos grupo esPublico: "Cumplimiento normativo en el grupo esPublico"', Sesión: 'Sesión 2', Tipo: 'Presencial', 'Hora inicio': '12:30', 'Hora fin': '13:30' },
  // Sesión 3 – Día 1
  { slotId: 's3d1', Actividad: 'Formación Expertos grupo esPublico: "Módulo de Control Interno"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '10:00' },
  { slotId: 's3d1', Actividad: 'Taller 8: "Taller del módulo de diseño de control interno"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '10:00', 'Hora fin': '11:30' },
  { slotId: 's3d1', Actividad: 'Formación Expertos grupo esPublico: "Infraestructura de sistemas de Gestiona"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '12:00', 'Hora fin': '13:00' },
  { slotId: 's3d1', Actividad: 'Formación Expertos grupo esPublico: "Ciberseguridad – SOC"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '13:00', 'Hora fin': '14:00' },
  { slotId: 's3d1', Actividad: 'Comida', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '14:00', 'Hora fin': '16:00' },
  { slotId: 's3d1', Actividad: 'Taller 9 "360° Tramitación de expedientes con gasto"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '16:00', 'Hora fin': '18:00' },
  // Sesión 3 – Día 2
  { slotId: 's3d2', Actividad: 'Taller 10 "Gestión de facturas"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '11:00' },
  { slotId: 's3d2', Actividad: 'Taller 11 "Autoliquidaciones y liquidaciones tributarias"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '11:30', 'Hora fin': '12:30' },
  { slotId: 's3d2', Actividad: 'Formación expertos grupo esPublico: "Integraciones API"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '12:30', 'Hora fin': '13:30' },
  { slotId: 's3d2', Actividad: 'Formación Expertos grupo esPublico "Tecnología de testing y QA"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '13:30', 'Hora fin': '14:30' },
  { slotId: 's3d2', Actividad: 'Comida', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '14:30', 'Hora fin': '16:30' },
  { slotId: 's3d2', Actividad: 'Taller "Dinámica de Metodología de implantación"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '16:30', 'Hora fin': '19:00' },
  // Sesión 3 – Día 3
  { slotId: 's3d3', Actividad: 'Exposiciones dinámica metodología de implantación', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '10:00' },
  { slotId: 's3d3', Actividad: 'Taller 12 "Creación de dashboards de analítica de datos"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '10:00', 'Hora fin': '11:00' },
  { slotId: 's3d3', Actividad: 'Formación en habilidades interpersonales', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '11:30', 'Hora fin': '14:30' },
  { slotId: 's3d3', Actividad: 'Comida', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '14:30', 'Hora fin': '16:30' },
  { slotId: 's3d3', Actividad: 'Cena', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '20:30', 'Hora fin': '' },
  // Sesión 3 – Día 4
  { slotId: 's3d4', Actividad: 'Proyecto de evaluación final', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '09:00', 'Hora fin': '09:30' },
  { slotId: 's3d4', Actividad: 'Formación expertos grupo esPublico: "Analítica de datos"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '09:30', 'Hora fin': '10:30' },
  { slotId: 's3d4', Actividad: 'Taller 13 "Personalización de cuadros de mando para tramitación reglada"', Sesión: 'Sesión 3', Tipo: 'Presencial', 'Hora inicio': '11:00', 'Hora fin': '13:00' },
  // Cierre
  { slotId: 'cierre', Actividad: 'Fecha fin evaluación final', Sesión: '', Tipo: 'Online', 'Hora inicio': '', 'Hora fin': '' },
]

// ─── EventRow fields for mapping ────────────────────────────────────────────────
const EVENT_ROW_FIELDS: (keyof EventRow)[] = [
  'ID', 'CÓDIGO', 'Convocatoria', 'Actividad', 'Sesión', 'Tipo',
  'Día', 'Día Mes', 'Hora inicio', 'Hora fin', 'Calendar',
  'Agente', 'Agente 2', 'Agente 3', 'Agente 4',
]

// Auto-detect mapping from Excel column name to EventRow field
function autoDetectField(colName: string): keyof EventRow | '' {
  const s = colName.toLowerCase().trim()
  const aliases: [string[], keyof EventRow][] = [
    [['id', 'identificador'], 'ID'],
    [['código', 'codigo', 'code', 'cod', 'cód'], 'CÓDIGO'],
    [['convocatoria', 'call', 'programa', 'convoc'], 'Convocatoria'],
    [['actividad', 'activity', 'taller', 'evento', 'nombre', 'name'], 'Actividad'],
    [['sesión', 'sesion', 'session', 'grupo', 'ses'], 'Sesión'],
    [['tipo', 'type', 'modalidad', 'formato', 'format'], 'Tipo'],
    [['día', 'dia', 'date', 'fecha'], 'Día'],
    [['día mes', 'dia mes', 'daymonth'], 'Día Mes'],
    [['hora inicio', 'hora_inicio', 'start', 'inicio', 'from', 'start time'], 'Hora inicio'],
    [['hora fin', 'hora_fin', 'end', 'fin', 'to', 'end time'], 'Hora fin'],
    [['calendar', 'calendario'], 'Calendar'],
    [['agente', 'agent', 'formador', 'instructor', 'trainer'], 'Agente'],
    [['agente 2', 'agente2', 'agent 2', 'agent2', 'formador 2'], 'Agente 2'],
    [['agente 3', 'agente3', 'agent 3', 'agent3'], 'Agente 3'],
    [['agente 4', 'agente4', 'agent 4', 'agent4'], 'Agente 4'],
  ]
  for (const [keys, field] of aliases) {
    if (keys.some(k => s === k || s.includes(k))) return field
  }
  return ''
}

// ─── Parse Excel/CSV file ────────────────────────────────────────────────────────
async function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  if (file.name.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (!lines.length) return { headers: [], rows: [] }
    // Simple CSV parse (handles quoted fields)
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

  // Excel files via xlsx dynamic import
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
    throw new Error('No se pudo leer el archivo Excel. Asegúrate de que xlsx esté instalado (npm install) o usa un archivo CSV.')
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateConvocatoriaModal({ onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<'template' | 'excel'>('template')

  // Template tab state
  const [convName, setConvName] = useState('')
  const [slotDates, setSlotDates] = useState<Record<string, string>>({})
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Excel tab state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, keyof EventRow | ''>>({})
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload')
  const [importError, setImportError] = useState<string | null>(null)
  const [importCount, setImportCount] = useState(0)

  const toggleSlot = (id: string) =>
    setExpandedSlots(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })

  // ── Template save ──────────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!convName.trim()) { setSaveError('Introduce un nombre para la convocatoria'); return }
    setSaving(true)
    setSaveError(null)
    try {
      const ts = Date.now()
      const rows: Partial<EventRow>[] = TEMPLATE_EVENTS.map((ev, idx) => {
        const isoDate = slotDates[ev.slotId] ?? null
        let diaMes = null
        if (isoDate) {
          const d = new Date(isoDate + 'T00:00:00')
          const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
          diaMes = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
        }
        return {
          ID: `${convName.trim().replace(/\s+/g, '-')}-${ts}-${idx}`,
          Convocatoria: convName.trim(),
          Actividad: ev.Actividad,
          Sesión: ev.Sesión,
          Tipo: ev.Tipo,
          Día: isoDate,
          'Día Mes': diaMes,
          'Hora inicio': ev['Hora inicio'] || null,
          'Hora fin': ev['Hora fin'] || null,
        }
      })
      const { error } = await supabase.from('eventmaster_main').insert(rows)
      if (error) throw error
      onSuccess()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Excel handling ──────────────────────────────────────────────────────────
  const handleFileSelected = useCallback(async (file: File) => {
    setImportError(null)
    setImportStep('mapping')
    try {
      const { headers, rows } = await parseFile(file)
      setParsedHeaders(headers)
      setParsedRows(rows)
      const mapping: Record<string, keyof EventRow | ''> = {}
      headers.forEach(h => { mapping[h] = autoDetectField(h) })
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
      const rows: Partial<EventRow>[] = parsedRows.map((row, idx) => {
        const record: Partial<EventRow> = {}
        Object.entries(columnMapping).forEach(([col, field]) => {
          if (field && row[col] !== undefined) {
            (record as Record<string, string>)[field] = row[col]
          }
        })
        if (!record.ID) {
          record.ID = `excel-import-${Date.now()}-${idx}`
        }
        return record
      }).filter(r => Object.keys(r).length > 1) // at least 1 field besides ID

      if (!rows.length) throw new Error('No hay filas válidas para importar')

      const CHUNK = 500
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await supabase.from('eventmaster_main').insert(rows.slice(i, i + CHUNK))
        if (error) throw error
      }
      setImportCount(rows.length)
      setImportStep('done')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar')
      setImportStep('mapping')
    }
  }

  const slotEventsMap = TEMPLATE_EVENTS.reduce<Record<string, TemplateEventDef[]>>((acc, ev) => {
    if (!acc[ev.slotId]) acc[ev.slotId] = []
    acc[ev.slotId].push(ev)
    return acc
  }, {})

  const assignedCount = Object.values(slotDates).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-2xl max-h-[92vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Crear Convocatoria</h2>
              <p className="text-white/40 text-xs">Desde plantilla o importar Excel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setActiveTab('template')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'template'
                ? 'text-emerald-300 border-b-2 border-emerald-400 bg-emerald-500/5'
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
                ? 'text-emerald-300 border-b-2 border-emerald-400 bg-emerald-500/5'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <FileSpreadsheet className="w-4 h-4" /> Cargar Excel
          </button>
        </div>

        {/* ── TAB: TEMPLATE ─────────────────────────────────────────────────── */}
        {activeTab === 'template' && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Convocatoria name */}
              <div className="p-5 border-b border-white/5">
                <label className="text-white/50 text-xs mb-1.5 block uppercase tracking-wider">
                  Nombre de la Convocatoria
                </label>
                <input
                  type="text"
                  placeholder="Ej: Convocatoria 2026 – Ayuntamiento de..."
                  value={convName}
                  onChange={e => setConvName(e.target.value)}
                  className="input-field text-sm"
                  autoFocus
                />
              </div>

              {/* Day slots */}
              <div className="divide-y divide-white/5">
                {DAY_SLOTS.map(slot => {
                  const events = slotEventsMap[slot.id] ?? []
                  const isExpanded = expandedSlots.has(slot.id)
                  const dateVal = slotDates[slot.id] ?? ''
                  const hasDate = !!dateVal

                  return (
                    <div key={slot.id} className="group">
                      {/* Slot row */}
                      <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-all">
                        {/* Expand toggle */}
                        <button
                          onClick={() => toggleSlot(slot.id)}
                          className="text-white/30 hover:text-white/60 transition-all flex-shrink-0"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {/* Slot label */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white/80 text-sm font-medium">{slot.label}</span>
                            {slot.suggestedDay && (
                              <span className="text-white/25 text-xs">({slot.suggestedDay})</span>
                            )}
                          </div>
                          <span className="text-white/30 text-xs">{events.length} evento{events.length !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Date input */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasDate && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          <input
                            type="date"
                            value={dateVal}
                            onChange={e => setSlotDates(prev => ({ ...prev, [slot.id]: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            className="input-field text-xs py-1.5 w-36"
                          />
                        </div>
                      </div>

                      {/* Expanded events */}
                      {isExpanded && (
                        <div className="bg-white/[0.02] border-t border-white/5 px-5 py-2 space-y-1">
                          {events.map((ev, i) => (
                            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                              <div className="flex-1 min-w-0">
                                <span className="text-white/70 text-xs block truncate">{ev.Actividad}</span>
                                <div className="flex gap-2 mt-0.5">
                                  {ev.Sesión && (
                                    <span className="text-white/30 text-[10px]">{ev.Sesión}</span>
                                  )}
                                  <span className={cn(
                                    'text-[10px] px-1.5 py-0 rounded',
                                    ev.Tipo?.toLowerCase().includes('presencial')
                                      ? 'bg-amber-500/15 text-amber-400'
                                      : 'bg-cyan-500/15 text-cyan-400'
                                  )}>{ev.Tipo}</span>
                                </div>
                              </div>
                              <div className="text-white/40 text-[10px] font-mono flex-shrink-0 text-right">
                                {ev['Hora inicio'] || '—'}
                                {ev['Hora fin'] && ` – ${ev['Hora fin']}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-white/10 p-5">
              {saveError && (
                <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 text-white/30 text-xs">
                  {assignedCount}/{DAY_SLOTS.length} días con fecha asignada · {TEMPLATE_EVENTS.length} eventos
                </div>
                <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving || !convName.trim()}
                  className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {saving
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creando...</>
                    : <><Plus className="w-4 h-4" /> Crear convocatoria</>
                  }
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: EXCEL ────────────────────────────────────────────────────── */}
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
                      ? 'border-emerald-400/60 bg-emerald-500/10'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  )}
                >
                  <FileSpreadsheet className={cn('w-12 h-12', isDragging ? 'text-emerald-400' : 'text-white/20')} />
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

              {/* STEP: Mapping */}
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
                      <div key={header} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
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
                          onChange={e => setColumnMapping(prev => ({ ...prev, [header]: e.target.value as keyof EventRow | '' }))}
                          className="input-field text-xs py-1.5 w-44 flex-shrink-0"
                        >
                          <option value="">— No asignar —</option>
                          {EVENT_ROW_FIELDS.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        {columnMapping[header] && (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: Importing */}
              {importStep === 'importing' && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                  <p className="text-white/60 text-sm">Importando datos...</p>
                </div>
              )}

              {/* STEP: Done */}
              {importStep === 'done' && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-base font-medium">¡Importación completada!</p>
                    <p className="text-white/40 text-sm mt-1">{importCount} evento{importCount !== 1 ? 's' : ''} importado{importCount !== 1 ? 's' : ''} correctamente</p>
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
                  className="btn-primary px-6 py-2 text-sm flex items-center gap-2"
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
                      className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
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
