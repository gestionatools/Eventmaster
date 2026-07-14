'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Filter,
  RefreshCw, Search, Clock, User, Tag, Hash, Layers, CalendarDays, Download, Trash2, Star, Wifi
} from 'lucide-react'
import { supabase, EventRow, GestionaEventRow, FINEventRow } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import { cn } from '@/lib/utils'
import CreateConvocatoriaModal from './CreateConvocatoriaModal'
import DeleteConvocatoriaModal from './DeleteConvocatoriaModal'
import CalendarEventModal from './CalendarEventModal'
import HolidaysModal from './HolidaysModal'
import CreateGestionaEventModal from './CreateGestionaEventModal'
import CreateFINEventModal from './CreateFINEventModal'
import CreateSpecialFINEventModal from './CreateSpecialFINEventModal'

// ─── Color palette for convocatorias ──────────────────────────────────────────
const CONVOCATORIA_COLORS = [
  { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200',    ring: 'bg-blue-100' },
  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 border-violet-200',  ring: 'bg-violet-100' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'bg-emerald-100' },
  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',   ring: 'bg-amber-100' },
  { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',    ring: 'bg-rose-100' },
  { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700',    dot: 'bg-cyan-500',    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',    ring: 'bg-cyan-100' },
  { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200',  ring: 'bg-orange-100' },
  { bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-700',    dot: 'bg-pink-500',    badge: 'bg-pink-50 text-pink-700 border-pink-200',    ring: 'bg-pink-100' },
  { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    dot: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 border-teal-200',    ring: 'bg-teal-100' },
  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',  ring: 'bg-indigo-100' },
]

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]
const DAYS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

// ─── Convocatoria type classification ────────────────────────────────────────
type ConvocatoriaType = 'normal' | 'analiza' | 'developers'

function getConvocatoriaType(name: string | null | undefined): ConvocatoriaType {
  if (!name) return 'normal'
  const lower = name.toLowerCase()
  if (lower.includes('analiza')) return 'analiza'
  if (lower.includes('developers')) return 'developers'
  return 'normal'
}

const CONVOCATORIA_TYPE_LABELS: Record<ConvocatoriaType, string> = {
  normal: 'Convocatoria',
  analiza: 'Analiza',
  developers: 'Developers',
}

const CONVOCATORIA_TYPE_STYLES: Record<ConvocatoriaType, { active: string; dot: string }> = {
  normal:     { active: 'bg-amber-50 text-amber-700 border-amber-300',    dot: 'bg-amber-500' },
  analiza:    { active: 'bg-blue-50 text-blue-700 border-blue-300',       dot: 'bg-blue-500' },
  developers: { active: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
}

// Presencial highlight style varies by convocatoria type
const PRESENCIAL_STYLES: Record<ConvocatoriaType, { cell: string; circle: string; ring: string }> = {
  normal:     { cell: 'bg-orange-50 text-orange-700 ring-1 ring-orange-300',  circle: 'bg-orange-500 ring-2 ring-orange-300',   ring: 'bg-orange-500/8' },
  analiza:    { cell: 'bg-blue-50 text-blue-700 ring-1 ring-blue-300',        circle: 'bg-blue-500 ring-2 ring-blue-300',       ring: 'bg-blue-500/8' },
  developers: { cell: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300', circle: 'bg-emerald-500 ring-2 ring-emerald-300', ring: 'bg-emerald-500/8' },
}

function getPresencialStyle(convocatoria: string | null | undefined) {
  return PRESENCIAL_STYLES[getConvocatoriaType(convocatoria)]
}

// Online highlight style — deliberately bold & fixed-hue (sky) so it reads at a
// glance in month/year views, unlike the generic per-convocatoria dot it used to fall back to.
const ONLINE_STYLE = {
  cell: 'bg-sky-50 text-sky-700 ring-1 ring-sky-300',
  circle: 'bg-sky-500 ring-2 ring-sky-300',
  ring: 'bg-sky-500/8',
  dot: 'bg-sky-500',
}

// Festivo highlight style (red – characteristic holiday color)
const FESTIVO_STYLE = {
  cell: 'bg-red-50 text-red-700 ring-1 ring-red-300',
  circle: 'bg-red-500 ring-2 ring-red-300',
  ring: 'bg-red-500/8',
}

// Espublico highlight style (purple + hexagon indicator)
const ESPUBLICO_STYLE = {
  cell: 'bg-purple-50 text-purple-700',
  color: 'bg-purple-500',
  ring: 'bg-purple-500/8',
}

// Gestiona highlight style (teal + hexagon indicator, all-day event)
const GESTIONA_STYLE = {
  cell: 'bg-teal-50 text-teal-700 ring-1 ring-teal-300',
  color: 'bg-teal-500',
  ring: 'bg-teal-500/8',
}

// FIN (Formación Interna) highlight style (yellow + diamond indicator)
const FIN_STYLE = {
  cell: 'bg-yellow-50 text-yellow-700',
  color: 'bg-yellow-500',
  ring: 'bg-yellow-500/8',
}

function isTipoFestivo(tipo: string | null | undefined) {
  return (tipo ?? '').toLowerCase() === 'festivo'
}

function isTipoEspublico(tipo: string | null | undefined) {
  return (tipo ?? '').toLowerCase() === 'espublico'
}

function isTipoGestiona(tipo: string | null | undefined) {
  return (tipo ?? '').toLowerCase().includes('gestiona')
}

function isTipoOnline(tipo: string | null | undefined) {
  return (tipo ?? '').toLowerCase().includes('online')
}

// ─── Gestiona range check ────────────────────────────────────────────────────
function isDateInGestionaRange(date: Date, gEvents: GestionaEventRow[]): boolean {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return gEvents.some(e => {
    if (!e.fechainicio) return false
    const s = new Date(e.fechainicio)
    const startDay = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime()
    const endDay = e.fechafin
      ? (() => { const d = new Date(e.fechafin!); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() })()
      : startDay
    return day >= startDay && day <= endDay
  })
}

// ─── FIN date check ───────────────────────────────────────────────────────────
function hasFINOnDay(date: Date, finEvents: FINEventRow[]): boolean {
  return finEvents.some(e => {
    if (!e.fecha) return false
    // Extract YYYY-MM-DD from ISO string to avoid UTC timezone shift
    const datePart = e.fecha.split('T')[0]
    if (!datePart) return false
    const [y, m, d] = datePart.split('-').map(Number)
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  })
}

// ─── Date parsing ─────────────────────────────────────────────────────────────
const SPANISH_MONTHS: Record<string, number> = {
  ene:0, enero:0, feb:1, febrero:1, mar:2, marzo:2,
  abr:3, abril:3, may:4, mayo:4, jun:5, junio:5,
  jul:6, julio:6, ago:7, agosto:7, sep:8, septiembre:8, sept:8,
  oct:9, octubre:9, nov:10, noviembre:10, dic:11, diciembre:11
}

function tryParseDate(raw: string | null | undefined): Date | null {
  if (!raw || !raw.trim()) return null
  const s = raw.trim()

  // Try ISO YYYY-MM-DD (parse manually to avoid UTC timezone offset shifting the date)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))

  // Try YYYY/MM/DD
  const ymdSlash = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
  if (ymdSlash) return new Date(parseInt(ymdSlash[1]), parseInt(ymdSlash[2]) - 1, parseInt(ymdSlash[3]))

  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/)
  if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]))

  // Try "15 Ene 2024" or "15 enero 2024" or "15 de enero de 2024"
  const textMatch = s.toLowerCase().match(/(\d{1,2})\s+(?:de\s+)?([a-záéíóú]+)(?:\s+(?:de\s+)?(\d{4}))?/)
  if (textMatch) {
    const day = parseInt(textMatch[1])
    const monthKey = textMatch[2].substring(0, 3)
    const month = SPANISH_MONTHS[monthKey] ?? SPANISH_MONTHS[textMatch[2]]
    const year = textMatch[3] ? parseInt(textMatch[3]) : new Date().getFullYear()
    if (month !== undefined) return new Date(year, month, day)
  }

  return null
}

function parseEventDate(row: EventRow): Date | null {
  // Try Día first; if it fails (null, empty, or unrecognised format), fall back to Día Mes
  return tryParseDate(row['Día']) ?? tryParseDate(row['Día Mes'])
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// Monday-based week start for a given date
function getWeekStart(d: Date): Date {
  const offset = (d.getDay() + 6) % 7 // 0=Mon…6=Sun
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset)
}

// Lay out overlapping timed events into side-by-side columns within each
// overlap cluster (classic calendar-app interval partitioning).
function computeDayLayout<T extends { start: number; end: number }>(items: T[]): (T & { col: number; cols: number })[] {
  const sorted = [...items].sort((a, b) => a.start - b.start)
  const result: (T & { col: number; cols: number })[] = []
  let cluster: (T & { col: number })[] = []
  let colEnds: number[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (cluster.length === 0) return
    const cols = colEnds.length
    cluster.forEach(ev => result.push({ ...ev, cols }))
    cluster = []
    colEnds = []
  }

  sorted.forEach(ev => {
    if (cluster.length > 0 && ev.start >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    let placedCol = -1
    for (let i = 0; i < colEnds.length; i++) {
      if (colEnds[i] <= ev.start) { colEnds[i] = ev.end; placedCol = i; break }
    }
    if (placedCol === -1) { colEnds.push(ev.end); placedCol = colEnds.length - 1 }
    cluster.push({ ...ev, col: placedCol })
    clusterEnd = Math.max(clusterEnd, ev.end)
  })
  flush()

  return result
}

// Parse time string "HH:MM" to minutes since midnight
function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null
  const parts = t.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0])
  const m = parseInt(parts[1])
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// ─── ICS Export ──────────────────────────────────────────────────────────────
function exportToICS(events: ParsedEvent[]) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventmaster//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Eventmaster',
    'X-WR-TIMEZONE:Europe/Madrid',
  ]

  for (const ev of events) {
    if (!ev._date) continue
    const d = ev._date
    const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
    const startRaw = ev['Hora inicio']
    const endRaw   = ev['Hora fin']

    let dtStart: string
    let dtEnd: string
    let allDay = false

    if (startRaw) {
      const parts = startRaw.split(':').map(Number)
      const sh = parts[0], sm = parts[1] ?? 0
      dtStart = `${dateStr}T${pad(sh)}${pad(sm)}00`
      if (endRaw) {
        const ep = endRaw.split(':').map(Number)
        dtEnd = `${dateStr}T${pad(ep[0])}${pad(ep[1] ?? 0)}00`
      } else {
        const endH = sh + 2
        dtEnd = endH >= 24
          ? `${dateStr}T235900`
          : `${dateStr}T${pad(endH)}${pad(sm)}00`
      }
    } else {
      allDay = true
      dtStart = dateStr
      // DTEND for all-day = next day in iCalendar spec
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      dtEnd = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`
    }

    const summary = [ev.CÓDIGO, ev.Actividad].filter(Boolean).join(' - ') || 'Evento'
    const uid = `${ev.ID || ev.CÓDIGO || Math.random().toString(36).slice(2)}-eventmaster`
    const now = new Date()
    const dtstamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}Z`

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${dtstamp}`)
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`)
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`)
    } else {
      lines.push(`DTSTART:${dtStart}`)
      lines.push(`DTEND:${dtEnd}`)
    }
    lines.push(`SUMMARY:${summary.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n')}`)
    if (ev.Convocatoria) lines.push(`CATEGORIES:${ev.Convocatoria}`)
    const descParts = [ev.Actividad, ev.Sesión, ev.Tipo, ev.Agente].filter(Boolean)
    if (descParts.length) lines.push(`DESCRIPTION:${descParts.join('\\n').replace(/\n/g, '\\n')}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const content = lines.join('\r\n')
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'eventmaster.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Types ───────────────────────────────────────────────────────────────────
type ParsedEvent = EventRow & { _date: Date | null }
type ViewMode = 'year' | 'month' | 'week'
type MonthSpec = { year: number; month: number }

const EMPTY_FORM: Partial<EventRow> = {
  ID: '', CÓDIGO: '', Convocatoria: '', Actividad: '', Sesión: '',
  Tipo: '', Día: '', 'Día Mes': '', 'Hora inicio': '', 'Hora fin': '',
  Calendar: '', Agente: '', 'Agente 2': '', 'Agente 3': '', 'Agente 4': ''
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [events, setEvents]         = useState<ParsedEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode]     = useState<ViewMode>('year')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filters
  const [filterConvocatoria, setFilterConvocatoria] = useState<string[]>([])
  const [filterTipo, setFilterTipo]                 = useState('')
  const [filterCodigo, setFilterCodigo]             = useState('')
  const [filterTypes, setFilterTypes]               = useState<ConvocatoriaType[]>([])
  const [showFilters, setShowFilters]               = useState(false)

  // Selected event detail
  const [selectedEvent, setSelectedEvent] = useState<ParsedEvent | null>(null)

  // Day view modal
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null)

  // Create event modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createDate, setCreateDate]           = useState<Date | null>(null)
  const [formData, setFormData]               = useState<Partial<EventRow>>(EMPTY_FORM)
  const [saving, setSaving]                   = useState(false)
  const [saveError, setSaveError]             = useState<string | null>(null)

  // Convocatoria modals
  const [showCreateConvocatoria, setShowCreateConvocatoria]         = useState(false)
  const [showCalendarEventModal, setShowCalendarEventModal]         = useState(false)
  const [showDeleteConvocatoria, setShowDeleteConvocatoria]         = useState(false)
  const [showHolidaysModal, setShowHolidaysModal]                   = useState(false)
  const [showCreateGestionaModal, setShowCreateGestionaModal]       = useState(false)
  const [showCreateFINModal, setShowCreateFINModal]                 = useState(false)
  const [showCreateSpecialFINModal, setShowCreateSpecialFINModal]   = useState(false)

  // Gestiona events (events_Gestiona table)
  const [gestionaEvents, setGestionaEvents] = useState<GestionaEventRow[]>([])

  // FIN events (events_FIN table) + visibility filter (off by default)
  const [finEvents, setFinEvents]   = useState<FINEventRow[]>([])
  const [showFIN, setShowFIN]       = useState(false)

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const PAGE_SIZE = 1000
      let all: EventRow[] = []
      let from = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from('eventmaster_main')
          .select('*')
          .range(from, from + PAGE_SIZE - 1)
        if (error) throw error
        const rows = (data || []) as EventRow[]
        all = all.concat(rows)
        hasMore = rows.length === PAGE_SIZE
        from += PAGE_SIZE
      }
      setEvents(all.map(r => ({ ...r, _date: parseEventDate(r) })))

      // Fetch Gestiona events
      const { data: gData } = await supabase.from('events_Gestiona').select('*')
      setGestionaEvents((gData || []) as GestionaEventRow[])

      // Fetch FIN events
      const { data: finData } = await supabase.from('events_FIN').select('*')
      setFinEvents((finData || []) as FINEventRow[])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived data ────────────────────────────────────────────────────────────
  const convocatorias = useMemo(() =>
    Array.from(new Set(events.map(e => e.Convocatoria).filter(Boolean) as string[])).sort(),
    [events]
  )
  const tipos = useMemo(() =>
    Array.from(new Set(events.map(e => e.Tipo).filter(Boolean) as string[])).sort(),
    [events]
  )
  const colorMap = useMemo(() => {
    const map = new Map<string, typeof CONVOCATORIA_COLORS[0]>()
    convocatorias.forEach((c, i) => map.set(c, CONVOCATORIA_COLORS[i % CONVOCATORIA_COLORS.length]))
    return map
  }, [convocatorias])

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Festivos always shown regardless of filters
      if (isTipoFestivo(e.Tipo)) return true
      if (filterConvocatoria.length > 0 && !filterConvocatoria.includes(e.Convocatoria ?? '')) return false
      if (filterTipo && e.Tipo !== filterTipo) return false
      if (filterCodigo) {
        const code = (e.CÓDIGO ?? '').toLowerCase()
        if (!code.includes(filterCodigo.toLowerCase())) return false
      }
      if (filterTypes.length > 0 && !filterTypes.includes(getConvocatoriaType(e.Convocatoria))) return false
      return true
    })
  }, [events, filterConvocatoria, filterTipo, filterCodigo, filterTypes])

  // ── Cross-year range: when 1-3 convocatorias selected and events span multiple years,
  //    show exactly 12 months starting from the first event's month ─────────────────
  const crossYearRange = useMemo<MonthSpec[] | null>(() => {
    if (filterConvocatoria.length < 1 || filterConvocatoria.length > 3) return null
    const dated = filteredEvents.filter(e => e._date)
    if (dated.length === 0) return null
    const minDate = dated.reduce((m, e) => e._date! < m ? e._date! : m, dated[0]._date!)
    const maxDate = dated.reduce((m, e) => e._date! > m ? e._date! : m, dated[0]._date!)
    // Only apply custom range if events span across different years
    if (minDate.getFullYear() === maxDate.getFullYear()) return null
    // Always show exactly 12 months starting from the first event's month
    const specs: MonthSpec[] = []
    const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    for (let i = 0; i < 12; i++) {
      specs.push({ year: cur.getFullYear(), month: cur.getMonth() })
      cur.setMonth(cur.getMonth() + 1)
    }
    return specs
  }, [filterConvocatoria, filteredEvents])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const goBack = () => {
    const d = new Date(currentDate)
    if (viewMode === 'year') d.setFullYear(year - 1)
    else if (viewMode === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(month - 1)
    setCurrentDate(d)
  }
  const goForward = () => {
    const d = new Date(currentDate)
    if (viewMode === 'year') d.setFullYear(year + 1)
    else if (viewMode === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(month + 1)
    setCurrentDate(d)
  }
  const goToday = () => setCurrentDate(new Date())

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate])
  const weekEnd = useMemo(() => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6), [weekStart])

  // ── Day view ────────────────────────────────────────────────────────────────
  const openDayView = (date: Date) => {
    setDayViewDate(date)
  }

  // ── Create event helpers ────────────────────────────────────────────────────
  const openCreate = (date?: Date) => {
    const d = date ?? new Date()
    setCreateDate(d)
    const isoDate = d.toISOString().split('T')[0]
    const dayMes  = `${d.getDate()} ${MONTHS_ES[d.getMonth()].substring(0, 3)}`
    setFormData({ ...EMPTY_FORM, Día: isoDate, 'Día Mes': dayMes })
    setSaveError(null)
    setShowCreateModal(true)
  }

  const openCreatePresencial = (date?: Date) => {
    const d = date ?? new Date()
    setCreateDate(d)
    const isoDate = d.toISOString().split('T')[0]
    const dayMes  = `${d.getDate()} ${MONTHS_ES[d.getMonth()].substring(0, 3)}`
    setFormData({ ...EMPTY_FORM, Día: isoDate, 'Día Mes': dayMes, Tipo: 'Presencial' })
    setSaveError(null)
    setShowCreateModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await supabase.from('eventmaster_main').insert([formData])
      if (error) throw error
      setShowCreateModal(false)
      setFormData(EMPTY_FORM)
      await fetchData()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateForm = (key: keyof EventRow, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleConvocatoria = (c: string) => {
    setFilterConvocatoria(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const hasFilters = filterConvocatoria.length > 0 || filterTipo || filterCodigo || filterTypes.length > 0

  const toggleType = (t: ConvocatoriaType) =>
    setFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleRefresh = () => { setRefreshing(true); fetchData() }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <TopBar
        title="Calendario"
        subtitle={
          viewMode === 'year' && crossYearRange && crossYearRange.length > 0
            ? (() => {
                const first = crossYearRange[0]
                const last = crossYearRange[crossYearRange.length - 1]
                if (first.year === last.year)
                  return `${MONTHS_ES[first.month]} – ${MONTHS_ES[last.month]} ${first.year}`
                return `${MONTHS_ES[first.month]} ${first.year} – ${MONTHS_ES[last.month]} ${last.year}`
              })()
            : viewMode === 'year'
              ? `${year}`
              : viewMode === 'week'
                ? (weekStart.getMonth() === weekEnd.getMonth()
                    ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS_ES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
                    : `${weekStart.getDate()} ${MONTHS_ES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS_ES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`)
                : `${MONTHS_ES[month]} ${year}`
        }
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Toolbar */}
      <div className="glass-card p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* View toggle */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('week')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              viewMode === 'week' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
          >
            <Clock className="w-3.5 h-3.5" /> Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              viewMode === 'month' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Mes
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              viewMode === 'year' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
          >
            <Calendar className="w-3.5 h-3.5" /> Año
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="btn-ghost p-2 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="btn-secondary text-xs px-3 py-1.5">
            Hoy
          </button>
          <button onClick={goForward} className="btn-ghost p-2 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all border',
            showFilters || hasFilters
              ? 'bg-brand-50 text-brand-700 border-brand-200'
              : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800')}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {hasFilters && (
            <span className="w-4 h-4 bg-brand-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {filterConvocatoria.length + (filterTipo ? 1 : 0) + (filterCodigo ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Export ICS */}
        <button
          onClick={() => exportToICS(filteredEvents)}
          title="Exportar calendario (.ics) compatible con Outlook 365"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-50 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Exportar ICS
        </button>

        {/* Delete convocatoria */}
        <button
          onClick={() => setShowDeleteConvocatoria(true)}
          title="Borrar convocatoria"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" /> Borrar
        </button>

        {/* Create convocatoria – Excel import */}
        <button
          onClick={() => setShowCreateConvocatoria(true)}
          title="Importar convocatoria desde Excel"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-50 transition-all"
        >
          <CalendarDays className="w-4 h-4" /> Importar Excel
        </button>

        {/* Días festivos */}
        <button
          onClick={() => setShowHolidaysModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
        >
          <Star className="w-4 h-4" /> Días festivos
        </button>

        {/* Create Gestiona event */}
        <button
          onClick={() => setShowCreateGestionaModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
        >
          <span
            className="w-3.5 h-3.5 bg-red-500"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'inline-block' }}
          />
          Crear Evento Gestiona
        </button>

        {/* Create FIN event */}
        <button
          onClick={() => setShowCreateFINModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-all"
        >
          <span
            className="w-3.5 h-3.5 bg-yellow-500 inline-block flex-shrink-0"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
          Crear convocatoria FIN
        </button>

        {/* Create special FIN event */}
        <button
          onClick={() => setShowCreateSpecialFINModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-yellow-50/60 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 transition-all"
        >
          <span
            className="w-3.5 h-3.5 bg-yellow-400 inline-block flex-shrink-0"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
          Añadir convocatoria especial FIN
        </button>

        {/* Create convocatoria – Calendar modal */}
        <button
          onClick={() => setShowCalendarEventModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
        >
          <Calendar className="w-4 h-4" /> Crear convocatoria
        </button>

        {/* Create event */}
        <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2 px-3 py-1.5 text-sm">
          <Plus className="w-4 h-4" /> Nuevo evento
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="glass-card p-4 mb-4 animate-fade-in">
          <div className="flex flex-wrap gap-4">
            {/* Convocatoria filter */}
            <div className="flex-1 min-w-48">
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Convocatoria
              </label>
              <div className="flex flex-wrap gap-1.5">
                {convocatorias.map(c => {
                  const color = colorMap.get(c)
                  const active = filterConvocatoria.includes(c)
                  return (
                    <button
                      key={c}
                      onClick={() => toggleConvocatoria(c)}
                      className={cn('px-2.5 py-1 rounded-lg text-xs border transition-all',
                        active ? `${color?.badge} border-current` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5', color?.dot)} />
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tipo filter */}
            <div className="min-w-40">
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Tipo
              </label>
              <select
                value={filterTipo}
                onChange={e => setFilterTipo(e.target.value)}
                className="input-field text-sm py-1.5 pr-8"
              >
                <option value="">Todos los tipos</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Código filter */}
            <div className="min-w-48">
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Código
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar código..."
                  value={filterCodigo}
                  onChange={e => setFilterCodigo(e.target.value)}
                  className="input-field text-sm py-1.5 pl-9"
                />
              </div>
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterConvocatoria([]); setFilterTipo(''); setFilterCodigo('') }}
                  className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-all"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Convocatoria type selector */}
      <div className="glass-card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider mr-1">Tipo convocatoria:</span>
        {(['normal', 'analiza', 'developers'] as ConvocatoriaType[]).map(type => {
          const active = filterTypes.includes(type)
          const style = CONVOCATORIA_TYPE_STYLES[type]
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-all',
                active
                  ? style.active
                  : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className={cn(
                'w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                active ? `${style.dot} border-current` : 'border-slate-300'
              )}>
                {active && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
              </span>
              {CONVOCATORIA_TYPE_LABELS[type]}
            </button>
          )
        })}
        {filterTypes.length > 0 && (
          <button
            onClick={() => setFilterTypes([])}
            className="text-xs text-slate-400 hover:text-slate-600 transition-all"
          >
            × limpiar
          </button>
        )}

        {/* FIN filter separator + checkbox */}
        <span className="text-slate-200 text-xs">|</span>
        <button
          onClick={() => setShowFIN(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-all',
            showFIN
              ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
              : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
          )}
        >
          <span className={cn(
            'w-3.5 h-3.5 border-2 flex items-center justify-center flex-shrink-0 transition-all',
            showFIN ? 'border-yellow-500' : 'border-slate-300'
          )}
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          >
            {showFIN && <span className="text-yellow-600 text-[7px] font-bold leading-none">✓</span>}
          </span>
          FIN
        </button>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
          <span className="ml-3 text-slate-400">Cargando eventos...</span>
        </div>
      ) : viewMode === 'year' ? (
        <YearView
          year={year}
          events={filteredEvents}
          colorMap={colorMap}
          onDayClick={openDayView}
          onCreateEvent={openCreate}
          customMonths={crossYearRange ?? undefined}
          gestionaEvents={gestionaEvents}
          finEvents={finEvents}
          showFIN={showFIN}
        />
      ) : viewMode === 'week' ? (
        <WeekView
          weekStart={weekStart}
          events={filteredEvents}
          colorMap={colorMap}
          onDayClick={openDayView}
          onCreateEvent={openCreate}
          onEventClick={setSelectedEvent}
        />
      ) : (
        <MonthView
          year={year}
          month={month}
          events={filteredEvents}
          colorMap={colorMap}
          onDayClick={openDayView}
          onCreateEvent={openCreate}
          gestionaEvents={gestionaEvents}
          onEventClick={setSelectedEvent}
          finEvents={finEvents}
          showFIN={showFIN}
        />
      )}

      {/* Day view modal */}
      {dayViewDate && (
        <DayViewModal
          date={dayViewDate}
          events={filteredEvents}
          colorMap={colorMap}
          onClose={() => setDayViewDate(null)}
          onCreateEvent={(d) => { setDayViewDate(null); openCreate(d) }}
          onEventClick={setSelectedEvent}
        />
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          colorMap={colorMap}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Create event modal */}
      {showCreateModal && (
        <CreateEventModal
          date={createDate}
          formData={formData}
          convocatorias={convocatorias}
          tipos={tipos}
          saving={saving}
          error={saveError}
          onUpdate={updateForm}
          onSave={handleSave}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Create convocatoria modal (Excel/template) */}
      {showCreateConvocatoria && (
        <CreateConvocatoriaModal
          onClose={() => setShowCreateConvocatoria(false)}
          onSuccess={() => { fetchData() }}
        />
      )}

      {/* Calendar event placement modal */}
      {showCalendarEventModal && (
        <CalendarEventModal
          existingEvents={events}
          colorMap={colorMap}
          onClose={() => setShowCalendarEventModal(false)}
          onSuccess={() => { fetchData() }}
        />
      )}

      {/* Delete convocatoria modal */}
      {showDeleteConvocatoria && (
        <DeleteConvocatoriaModal
          convocatorias={convocatorias}
          selectedConvocatoria={filterConvocatoria.length === 1 ? filterConvocatoria[0] : undefined}
          onClose={() => setShowDeleteConvocatoria(false)}
          onSuccess={() => { fetchData(); setFilterConvocatoria([]) }}
        />
      )}

      {/* Holidays modal */}
      {showHolidaysModal && (
        <HolidaysModal
          initialYear={year}
          onClose={() => setShowHolidaysModal(false)}
          onSuccess={() => fetchData()}
        />
      )}

      {/* Create Gestiona event modal */}
      {showCreateGestionaModal && (
        <CreateGestionaEventModal
          onClose={() => setShowCreateGestionaModal(false)}
          onSuccess={() => fetchData()}
        />
      )}

      {/* Create FIN event modal */}
      {showCreateFINModal && (
        <CreateFINEventModal
          onClose={() => setShowCreateFINModal(false)}
          onSuccess={() => fetchData()}
        />
      )}

      {/* Create special FIN event modal */}
      {showCreateSpecialFINModal && (
        <CreateSpecialFINEventModal
          onClose={() => setShowCreateSpecialFINModal(false)}
          onSuccess={() => fetchData()}
        />
      )}
    </div>
  )
}

// ─── Year View ────────────────────────────────────────────────────────────────
function YearView({ year, events, colorMap, onDayClick, onCreateEvent, customMonths, gestionaEvents, finEvents, showFIN }: {
  year: number
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onDayClick: (d: Date) => void
  onCreateEvent: (d: Date) => void
  customMonths?: MonthSpec[]
  gestionaEvents: GestionaEventRow[]
  finEvents: FINEventRow[]
  showFIN: boolean
}) {
  const months: MonthSpec[] = customMonths ?? Array.from({ length: 12 }, (_, mi) => ({ year, month: mi }))
  const showYear = customMonths != null && customMonths.some(m => m.year !== customMonths[0].year)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {months.map(({ year: y, month: mi }) => (
        <MiniMonth
          key={`${y}-${mi}`}
          year={y}
          month={mi}
          events={events}
          colorMap={colorMap}
          onDayClick={onDayClick}
          onCreateEvent={onCreateEvent}
          showYear={showYear}
          gestionaEvents={gestionaEvents}
          finEvents={finEvents}
          showFIN={showFIN}
        />
      ))}
    </div>
  )
}

function MiniMonth({ year, month, events, colorMap, onDayClick, onCreateEvent, showYear, gestionaEvents, finEvents, showFIN }: {
  year: number
  month: number
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onDayClick: (d: Date) => void
  onCreateEvent: (d: Date) => void
  showYear?: boolean
  gestionaEvents: GestionaEventRow[]
  finEvents: FINEventRow[]
  showFIN: boolean
}) {
  const today = new Date()
  const firstDay = new Date(year, month, 1)
  // Monday-based: 0=Mon…6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = startOffset + daysInMonth

  const monthEvents = events.filter(e => {
    if (!e._date) return false
    return e._date.getFullYear() === year && e._date.getMonth() === month
  })

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-700 text-sm font-semibold">
          {MONTHS_ES[month]}
          {showYear && <span className="text-slate-400 text-xs font-normal ml-1.5">{year}</span>}
        </h3>
        <span className="text-slate-300 text-xs">{monthEvents.length} ev.</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="text-slate-300 text-[9px] text-center font-medium">{d[0]}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: Math.ceil(cells / 7) * 7 }, (_, i) => {
          const dayNum = i - startOffset + 1
          if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />
          const date = new Date(year, month, dayNum)
          const isToday = sameDay(date, today)
          const dayEvents = monthEvents.filter(e => e._date && sameDay(e._date, date))
          const colors = Array.from(new Set(dayEvents.filter(e => !isTipoFestivo(e.Tipo)).map(e => colorMap.get(e.Convocatoria ?? '')?.dot).filter(Boolean))) as string[]
          const firstFestivo    = dayEvents.find(e => isTipoFestivo(e.Tipo))
          const firstEspublico  = dayEvents.find(e => isTipoEspublico(e.Tipo))
          const firstGestiona   = dayEvents.find(e => isTipoGestiona(e.Tipo))
          const firstPresencial = dayEvents.find(e => (e.Tipo ?? '').toLowerCase().includes('presencial'))
          const firstOnline     = dayEvents.find(e => isTipoOnline(e.Tipo))
          const hasFestivo    = !!firstFestivo
          const hasEspublico  = !!firstEspublico
          const hasGestiona   = !!firstGestiona
          const hasPresencial = !!firstPresencial
          const hasOnline     = !!firstOnline && !hasFestivo && !hasEspublico && !hasGestiona
          const presencialStyle = firstPresencial ? getPresencialStyle(firstPresencial.Convocatoria) : null
          const hasGestionaRange = isDateInGestionaRange(date, gestionaEvents)
          const hasFIN = showFIN && hasFINOnDay(date, finEvents)

          return (
            <button
              key={i}
              onClick={() => onDayClick(date)}
              onDoubleClick={() => onCreateEvent(date)}
              title={`${dayNum} ${MONTHS_ES[month]} — ${dayEvents.length} evento(s)${dayEvents.length ? '\n' + dayEvents.map(e => e.Actividad || e.Convocatoria).join('\n') : ''}`}
              className={cn(
                'aspect-square rounded flex flex-col items-center justify-center relative transition-all hover:bg-slate-100 group',
                isToday
                  ? 'bg-brand-50 text-brand-700 font-bold'
                  : hasFestivo
                    ? 'font-semibold text-red-700'
                    : hasEspublico
                      ? `font-semibold ${ESPUBLICO_STYLE.cell}`
                      : hasGestiona
                        ? `font-semibold ${GESTIONA_STYLE.cell}`
                        : hasPresencial
                          ? `font-semibold ${presencialStyle!.cell}`
                          : hasOnline
                            ? `font-semibold ${ONLINE_STYLE.cell}`
                            : 'text-slate-500'
              )}
            >
              {/* Gestiona range: red hexagon overlay superimposed on the day */}
              {hasGestionaRange && (
                <span
                  className="absolute inset-0 bg-red-500/20 pointer-events-none z-20"
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                />
              )}
              {/* FIN: yellow diamond overlay superimposed on the day */}
              {hasFIN && (
                <span
                  className="absolute inset-0 bg-yellow-500/20 pointer-events-none z-20"
                  style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                />
              )}
              {/* Day number with shape indicators */}
              <span className="relative flex items-center justify-center w-5 h-5">
                {!isToday && hasFestivo && (
                  <span className={cn('absolute inset-0 rounded-full', FESTIVO_STYLE.circle)} />
                )}
                {!isToday && hasEspublico && !hasFestivo && (
                  <span
                    className={cn('absolute inset-0', ESPUBLICO_STYLE.color)}
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  />
                )}
                {!isToday && hasGestiona && !hasFestivo && !hasEspublico && (
                  <span
                    className={cn('absolute inset-0', GESTIONA_STYLE.color)}
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  />
                )}
                {!isToday && hasOnline && (
                  <span className={cn('absolute inset-0 rounded-full', ONLINE_STYLE.circle)} />
                )}
                <span className={cn('relative z-10 text-[10px] leading-none', !isToday && hasOnline && 'text-white')}>{dayNum}</span>
              </span>
              {/* Color indicators row (no dot for festivos) — shows every distinct event marker for the day */}
              <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full">
                {hasEspublico && (
                  <span
                    className="w-1.5 h-1.5 bg-purple-500"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    title="Espublico"
                  />
                )}
                {hasGestiona && !hasEspublico && (
                  <span
                    className="w-1.5 h-1.5 bg-teal-500"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    title="Gestiona"
                  />
                )}
                {hasFIN && (
                  <span
                    className="w-1.5 h-1.5 bg-yellow-500"
                    style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                    title="FIN"
                  />
                )}
                {hasOnline && (
                  <span
                    className="w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-200"
                    title="Online"
                  />
                )}
                {colors.map((c, ci) => (
                  <span key={ci} className={cn('w-1.5 h-1.5 rounded-full', c)} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────
// Hourly schedule grid, 7 day-columns, individual events broken out and
// positioned by start/end time (with side-by-side layout for overlaps).
function WeekView({ weekStart, events, colorMap, onDayClick, onCreateEvent, onEventClick }: {
  weekStart: Date
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onDayClick: (d: Date) => void
  onCreateEvent: (d: Date) => void
  onEventClick: (e: ParsedEvent) => void
}) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i))

  const weekEvents = events.filter(e => e._date && days.some(d => sameDay(d, e._date!)))

  const allMinutes = weekEvents.flatMap(e => [
    parseTimeToMinutes(e['Hora inicio']),
    parseTimeToMinutes(e['Hora fin']),
  ]).filter((v): v is number => v !== null)

  const minHour = allMinutes.length > 0 ? Math.max(0, Math.floor(Math.min(...allMinutes) / 60) - 1) : 8
  const maxHour = allMinutes.length > 0 ? Math.min(23, Math.ceil(Math.max(...allMinutes) / 60) + 1) : 20
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i)
  const HOUR_HEIGHT = 60

  const DAYS_FULL_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex overflow-x-auto scrollbar-thin">
        {/* Time axis */}
        <div className="w-14 flex-shrink-0 border-r border-slate-200 sticky left-0 bg-white z-20">
          <div className="h-16 border-b border-slate-200" />
          {hours.map(h => (
            <div key={h} className="relative border-t border-slate-100" style={{ height: HOUR_HEIGHT }}>
              <span className="absolute top-1 right-2 text-slate-400 text-[10px] font-mono">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1 min-w-0">
          {days.map(date => {
            const isToday = sameDay(date, today)
            const dayEvents = weekEvents
              .filter(e => e._date && sameDay(e._date, date))
              .sort((a, b) => (a['Hora inicio'] ?? '').localeCompare(b['Hora inicio'] ?? ''))

            const untimedEvents = dayEvents.filter(e => parseTimeToMinutes(e['Hora inicio']) === null || isTipoGestiona(e.Tipo))
            const timedEvents = dayEvents.filter(e => !untimedEvents.includes(e))

            const laidOut = computeDayLayout(
              timedEvents.map(e => {
                const start = parseTimeToMinutes(e['Hora inicio'])!
                const end = parseTimeToMinutes(e['Hora fin']) ?? start + 60
                return { ...e, start, end: Math.max(end, start + 15) }
              })
            )

            return (
              <div key={date.toISOString()} className="flex-1 min-w-[150px] border-r border-slate-100 last:border-r-0 flex flex-col">
                {/* Day header */}
                <button
                  onClick={() => onDayClick(date)}
                  className={cn(
                    'h-16 flex flex-col items-center justify-center gap-0.5 border-b border-slate-200 flex-shrink-0 sticky top-0 z-10 transition-colors',
                    isToday ? 'bg-brand-50' : 'bg-white hover:bg-slate-50'
                  )}
                >
                  <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide">
                    {DAYS_FULL_ES[date.getDay()].slice(0, 3)}
                  </span>
                  <span className={cn(
                    'text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-brand-600 text-white' : 'text-slate-700'
                  )}>
                    {date.getDate()}
                  </span>
                </button>

                {/* Untimed / all-day events (Gestiona, missing hours, etc.) */}
                {untimedEvents.length > 0 && (
                  <div className="border-b border-slate-100 bg-slate-50/60 p-1 space-y-1 flex-shrink-0">
                    {untimedEvents.map((ev, ei) => {
                      const color = colorMap.get(ev.Convocatoria ?? '')
                      const evFestivo   = isTipoFestivo(ev.Tipo)
                      const evEspublico = isTipoEspublico(ev.Tipo)
                      const evGestiona  = isTipoGestiona(ev.Tipo)
                      return (
                        <button
                          key={ei}
                          onClick={() => onEventClick(ev)}
                          className={cn(
                            'w-full text-left rounded px-1.5 py-0.5 border text-[10px] leading-snug truncate flex items-center gap-1',
                            evFestivo
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : evEspublico
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : evGestiona
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : color
                                    ? `${color.bg} ${color.text} ${color.border}`
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                          )}
                          title={ev.Actividad ?? ev.Convocatoria ?? ''}
                        >
                          {ev.Actividad || ev.Sesión || ev.CÓDIGO || '—'}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Hourly grid */}
                <div
                  className="relative flex-1 cursor-pointer"
                  style={{ height: hours.length * HOUR_HEIGHT }}
                  onDoubleClick={() => onCreateEvent(date)}
                >
                  {hours.map((h, hi) => (
                    <div key={h} className="absolute w-full border-t border-slate-100" style={{ top: hi * HOUR_HEIGHT }} />
                  ))}

                  {laidOut.map((ev, ei) => {
                    const color = colorMap.get(ev.Convocatoria ?? '')
                    const evFestivo   = isTipoFestivo(ev.Tipo)
                    const evEspublico = isTipoEspublico(ev.Tipo)
                    const evGestiona  = isTipoGestiona(ev.Tipo)
                    const evOnline    = isTipoOnline(ev.Tipo) && !evFestivo && !evEspublico && !evGestiona

                    const top = (ev.start - minHour * 60) / 60 * HOUR_HEIGHT
                    const height = Math.max(20, (ev.end - ev.start) / 60 * HOUR_HEIGHT)
                    const width = 100 / ev.cols
                    const left = ev.col * width

                    return (
                      <div
                        key={ei}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                        className={cn(
                          'absolute rounded px-1.5 py-0.5 border overflow-hidden cursor-pointer hover:z-30 hover:shadow-md transition-shadow',
                          evFestivo
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : evEspublico
                              ? 'bg-purple-50 border-purple-300 text-purple-700'
                              : evGestiona
                                ? 'bg-teal-50 border-teal-300 text-teal-700'
                                : color
                                  ? `${color.bg} ${color.border} ${color.text}`
                                  : 'bg-slate-100 border-slate-200 text-slate-600',
                          evOnline && 'border-l-4 border-l-sky-500'
                        )}
                        style={{ top: top + 1, height: height - 2, left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)` }}
                        title={ev.Actividad ?? ev.Convocatoria ?? ''}
                      >
                        <div className="flex items-center gap-1 text-[9px] font-medium leading-none mb-0.5 opacity-70">
                          {evOnline && <Wifi className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />}
                          <span>
                            {ev['Hora inicio']?.slice(0, 5)}
                            {ev['Hora fin'] ? ` – ${ev['Hora fin'].slice(0, 5)}` : ''}
                          </span>
                        </div>
                        <div className="text-[10px] font-medium leading-tight truncate">
                          {ev.Actividad || ev.CÓDIGO || '—'}
                        </div>
                        {height > 46 && ev.Sesión && (
                          <div className="text-[9px] opacity-70 leading-tight truncate">{ev.Sesión}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({ year, month, events, colorMap, onDayClick, onCreateEvent, onEventClick, gestionaEvents, finEvents, showFIN }: {
  year: number
  month: number
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onDayClick: (d: Date) => void
  onCreateEvent: (d: Date) => void
  onEventClick: (e: ParsedEvent) => void
  gestionaEvents: GestionaEventRow[]
  finEvents: FINEventRow[]
  showFIN: boolean
}) {
  const today = new Date()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const monthEvents = events.filter(e => {
    if (!e._date) return false
    return e._date.getFullYear() === year && e._date.getMonth() === month
  })

  return (
    <div className="glass-card overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAYS_ES.map(d => (
          <div key={d} className="py-3 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - startOffset + 1
          const isOutside = dayNum < 1 || dayNum > daysInMonth
          if (isOutside) {
            return <div key={i} className="min-h-28 border-b border-slate-100 bg-slate-50/60" />
          }

          const date = new Date(year, month, dayNum)
          const isToday = sameDay(date, today)
          const dayEvents = monthEvents
            .filter(e => e._date && sameDay(e._date, date))
            .sort((a, b) => (a['Hora inicio'] ?? '').localeCompare(b['Hora inicio'] ?? ''))

          // Color of first event for the circle highlight
          const firstColor = dayEvents.length > 0
            ? colorMap.get(dayEvents[0].Convocatoria ?? '')
            : null
          const firstFestivo    = dayEvents.find(e => isTipoFestivo(e.Tipo))
          const firstEspublico  = dayEvents.find(e => isTipoEspublico(e.Tipo))
          const firstGestiona   = dayEvents.find(e => isTipoGestiona(e.Tipo))
          const firstPresencial = dayEvents.find(e => (e.Tipo ?? '').toLowerCase().includes('presencial'))
          const firstOnline     = dayEvents.find(e => isTipoOnline(e.Tipo))
          const hasFestivo    = !!firstFestivo
          const hasEspublico  = !!firstEspublico
          const hasGestiona   = !!firstGestiona
          const hasPresencial = !!firstPresencial
          const hasOnline     = !!firstOnline && !hasFestivo && !hasEspublico && !hasGestiona
          const presencialStyle = firstPresencial ? getPresencialStyle(firstPresencial.Convocatoria) : null
          const nonFestivoEvents = dayEvents.filter(e => !isTipoFestivo(e.Tipo))
          const hasGestionaRange = isDateInGestionaRange(date, gestionaEvents)
          const hasFIN = showFIN && hasFINOnDay(date, finEvents)

          return (
            <div
              key={i}
              onClick={() => onDayClick(date)}
              className={cn(
                'group min-h-28 border-b border-slate-100 p-1.5 flex flex-col cursor-pointer relative overflow-hidden',
                isToday
                  ? 'bg-brand-50/60'
                  : hasFestivo
                    ? FESTIVO_STYLE.ring
                    : hasEspublico
                      ? ESPUBLICO_STYLE.ring
                      : hasGestiona
                        ? GESTIONA_STYLE.ring
                        : hasPresencial
                          ? presencialStyle!.ring
                          : hasOnline
                            ? ONLINE_STYLE.ring
                            : hasFIN
                              ? FIN_STYLE.ring
                              : 'hover:bg-slate-50',
              )}
            >
              {/* Gestiona range: red hexagon overlay superimposed on the day cell */}
              {hasGestionaRange && (
                <span
                  className="absolute inset-0 bg-red-500/15 pointer-events-none z-10"
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                />
              )}
              {/* FIN: yellow diamond overlay superimposed on the day cell */}
              {hasFIN && (
                <span
                  className="absolute inset-0 bg-yellow-500/15 pointer-events-none z-10"
                  style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                />
              )}

              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'w-7 h-7 flex items-center justify-center text-xs font-medium relative transition-all',
                  // Use polygon shape for espublico, gestiona, and FIN (diamond)
                  (!isToday && (hasEspublico || hasGestiona || hasFIN) && !hasFestivo)
                    ? 'rounded overflow-visible'
                    : 'rounded-full overflow-hidden',
                  isToday
                    ? 'bg-brand-600 text-white'
                    : hasFestivo
                      ? 'text-white'
                      : hasEspublico
                        ? 'text-white'
                        : hasGestiona
                          ? 'text-white'
                          : hasPresencial
                            ? 'text-white'
                            : hasOnline
                              ? 'text-white'
                              : hasFIN
                                ? 'text-white'
                                : (firstColor ? 'text-slate-700' : 'text-slate-400')
                )}>
                  {/* Festivo: red filled circle */}
                  {!isToday && hasFestivo && (
                    <span className={cn('absolute inset-0 rounded-full', FESTIVO_STYLE.circle)} />
                  )}
                  {/* Espublico: purple hexagon */}
                  {!isToday && hasEspublico && !hasFestivo && (
                    <span
                      className={cn('absolute inset-0', ESPUBLICO_STYLE.color)}
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    />
                  )}
                  {/* Gestiona: teal hexagon (all-day event) */}
                  {!isToday && hasGestiona && !hasFestivo && !hasEspublico && (
                    <span
                      className={cn('absolute inset-0', GESTIONA_STYLE.color)}
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    />
                  )}
                  {/* Presencial: solid ring circle (per convocatoria type) */}
                  {!isToday && hasPresencial && !hasFestivo && !hasEspublico && !hasGestiona && (
                    <span className={cn('absolute inset-0 rounded-full', presencialStyle!.circle)} />
                  )}
                  {/* Online: bold sky circle — deliberately the same visual weight as Presencial/Festivo so it's no longer a barely-visible dot */}
                  {!isToday && hasOnline && !hasFestivo && !hasEspublico && !hasGestiona && !hasPresencial && (
                    <span className={cn('absolute inset-0 rounded-full', ONLINE_STYLE.circle)} />
                  )}
                  {/* FIN: yellow diamond */}
                  {!isToday && hasFIN && !hasFestivo && !hasEspublico && !hasGestiona && (
                    <span
                      className={cn('absolute inset-0', FIN_STYLE.color)}
                      style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                    />
                  )}
                  {/* Regular event: subtle color ring */}
                  {!isToday && !hasPresencial && !hasOnline && !hasFestivo && !hasEspublico && !hasGestiona && firstColor && (
                    <span className={cn('absolute inset-0 rounded-full', firstColor.ring)} />
                  )}
                  <span className="relative z-10">{dayNum}</span>
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCreateEvent(date) }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  title="Crear evento"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-0.5 flex-1">
                {nonFestivoEvents.slice(0, 3).map((ev, ei) => {
                  const color = colorMap.get(ev.Convocatoria ?? '')
                  const evFestivo   = isTipoFestivo(ev.Tipo)
                  const evEspublico = isTipoEspublico(ev.Tipo)
                  const evGestiona  = isTipoGestiona(ev.Tipo)
                  const evOnline    = isTipoOnline(ev.Tipo) && !evFestivo && !evEspublico && !evGestiona
                  return (
                    <button
                      key={ei}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                      className={cn(
                        'w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-snug truncate border transition-all hover:opacity-80 flex items-center gap-1',
                        evFestivo
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : evEspublico
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : evGestiona
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : evOnline
                                ? 'bg-sky-50 text-sky-700 border-sky-300'
                                : color
                                  ? `${color.bg} ${color.text} ${color.border}`
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                      )}
                      title={ev.Actividad ?? ev.Convocatoria ?? ''}
                    >
                      {evEspublico && (
                        <span
                          className="w-1.5 h-1.5 bg-purple-400 flex-shrink-0"
                          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                      )}
                      {evGestiona && !evEspublico && (
                        <span
                          className="w-1.5 h-1.5 bg-teal-400 flex-shrink-0"
                          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                      )}
                      {evOnline && (
                        <Wifi className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />
                      )}
                      {ev['Hora inicio'] && !evFestivo && !evEspublico && !evGestiona && (
                        <span className="opacity-70 mr-1">{ev['Hora inicio'].slice(0, 5)}</span>
                      )}
                      {ev.Actividad || ev.Convocatoria || ev.CÓDIGO}
                    </button>
                  )
                })}
                {/* Remaining events beyond the first 3: shown as dots (not hidden) so every event point for the day stays visible */}
                {nonFestivoEvents.length > 3 && (
                  <div className="flex flex-wrap items-center gap-1 px-1.5 pt-0.5">
                    {nonFestivoEvents.slice(3).map((ev, ei) => {
                      const color = colorMap.get(ev.Convocatoria ?? '')
                      const online = isTipoOnline(ev.Tipo)
                      return (
                        <span
                          key={ei}
                          title={ev.Actividad || ev.Convocatoria || ''}
                          className={cn(
                            'rounded-full flex-shrink-0',
                            online ? 'w-2.5 h-2.5 ring-2 ring-sky-200 bg-sky-500' : cn('w-1.5 h-1.5', color?.dot ?? 'bg-slate-300')
                          )}
                        />
                      )
                    })}
                    <span className="text-[9px] text-slate-400 ml-0.5">+{nonFestivoEvents.length - 3}</span>
                  </div>
                )}
                {/* FIN indicator badge */}
                {hasFIN && (
                  <div className="w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-snug truncate border bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-yellow-400 flex-shrink-0"
                      style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                    />
                    FIN
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day View Modal ───────────────────────────────────────────────────────────
function DayViewModal({ date, events, colorMap, onClose, onCreateEvent, onEventClick }: {
  date: Date
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onClose: () => void
  onCreateEvent: (d: Date) => void
  onEventClick: (e: ParsedEvent) => void
}) {
  const dayEvents = events
    .filter(e => e._date && sameDay(e._date, date))
    .sort((a, b) => (a['Hora inicio'] ?? '').localeCompare(b['Hora inicio'] ?? ''))

  // Unique convocatorias for this day (columns)
  const dayConvocatorias = Array.from(
    new Set(dayEvents.map(e => e.Convocatoria ?? '(Sin convocatoria)'))
  )

  // Hour range
  const allMinutes = dayEvents.flatMap(e => [
    parseTimeToMinutes(e['Hora inicio']),
    parseTimeToMinutes(e['Hora fin']),
  ]).filter((v): v is number => v !== null)

  const minHour = allMinutes.length > 0 ? Math.max(0, Math.floor(Math.min(...allMinutes) / 60) - 1) : 8
  const maxHour = allMinutes.length > 0 ? Math.min(23, Math.ceil(Math.max(...allMinutes) / 60) + 1) : 20

  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i)
  const HOUR_HEIGHT = 64 // px per hour

  const DAYS_FULL_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">
              {DAYS_FULL_ES[date.getDay()]}
            </p>
            <h2 className="text-slate-800 font-semibold text-xl">
              {date.getDate()} {MONTHS_ES[date.getMonth()]} {date.getFullYear()}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
              {dayConvocatorias.length > 0 && ` · ${dayConvocatorias.length} convocatoria${dayConvocatorias.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCreateEvent(date)}
              className="btn-primary text-sm flex items-center gap-1.5 px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {dayEvents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-300 gap-3">
            <CalendarDays className="w-10 h-10 opacity-40" />
            <p className="text-sm">No hay eventos este día</p>
            <button onClick={() => onCreateEvent(date)} className="btn-primary text-sm flex items-center gap-1.5 px-4 py-2 mt-2">
              <Plus className="w-3.5 h-3.5" /> Crear evento
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="flex min-h-full">
              {/* Time axis */}
              <div className="w-14 flex-shrink-0 border-r border-slate-200 bg-slate-50">
                {/* Space for column headers */}
                <div className="h-10" />
                {hours.map(h => (
                  <div key={h} className="relative border-t border-slate-100" style={{ height: HOUR_HEIGHT }}>
                    <span className="absolute top-1 right-2 text-slate-400 text-[10px] font-mono">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Convocatoria columns */}
              <div className="flex flex-1 min-w-0">
                {dayConvocatorias.map(conv => {
                  const color = colorMap.get(conv)
                  const convEvents = dayEvents.filter(
                    e => (e.Convocatoria ?? '(Sin convocatoria)') === conv
                  )

                  return (
                    <div key={conv} className="flex-1 min-w-36 border-r border-slate-100 last:border-r-0 flex flex-col">
                      {/* Column header */}
                      <div className={cn(
                        'h-10 flex items-center gap-1.5 px-3 border-b border-slate-200 flex-shrink-0 sticky top-0',
                        color?.badge ?? 'bg-slate-50 text-slate-500 border-slate-200'
                      )}>
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color?.dot ?? 'bg-slate-300')} />
                        <span className="text-[11px] font-medium truncate">{conv}</span>
                        <span className="ml-auto text-[10px] opacity-60">{convEvents.length}</span>
                      </div>

                      {/* Time grid */}
                      <div className="relative flex-1" style={{ height: hours.length * HOUR_HEIGHT }}>
                        {/* Hour lines */}
                        {hours.map((h, hi) => (
                          <div
                            key={h}
                            className="absolute w-full border-t border-slate-100"
                            style={{ top: hi * HOUR_HEIGHT }}
                          />
                        ))}

                        {/* Events */}
                        {convEvents.map((ev, ei) => {
                          const startMin = parseTimeToMinutes(ev['Hora inicio'])
                          const endMin = parseTimeToMinutes(ev['Hora fin'])

                          // Events without time: stack them at the top
                          if (startMin === null || isTipoGestiona(ev.Tipo)) {
                            const evFestivo   = isTipoFestivo(ev.Tipo)
                            const evEspublico = isTipoEspublico(ev.Tipo)
                            const evGestiona  = isTipoGestiona(ev.Tipo)
                            const evOnline    = isTipoOnline(ev.Tipo) && !evFestivo && !evEspublico && !evGestiona
                            return (
                              <div
                                key={ei}
                                className={cn(
                                  'mx-1 mb-1 rounded px-2 py-1 border cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5',
                                  evFestivo
                                    ? 'bg-red-50 border-red-200'
                                    : evEspublico
                                      ? 'bg-purple-50 border-purple-200'
                                      : evGestiona
                                        ? 'bg-teal-50 border-teal-200'
                                        : evOnline
                                          ? 'bg-sky-50 border-sky-300'
                                          : color
                                            ? `${color.bg} ${color.border}`
                                            : 'bg-slate-50 border-slate-200'
                                )}
                                style={{ marginTop: ei * 40 }}
                                onClick={() => onEventClick(ev)}
                              >
                                {evFestivo && (
                                  <Star className="w-3 h-3 text-red-500 flex-shrink-0" />
                                )}
                                {evEspublico && (
                                  <span
                                    className="w-2 h-2 bg-purple-400 flex-shrink-0"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                  />
                                )}
                                {evGestiona && !evEspublico && (
                                  <span
                                    className="w-2 h-2 bg-teal-400 flex-shrink-0"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                  />
                                )}
                                {evOnline && (
                                  <Wifi className="w-3 h-3 text-sky-600 flex-shrink-0" />
                                )}
                                <div className={cn(
                                  'text-[11px] font-medium truncate',
                                  evFestivo ? 'text-red-700' : evEspublico ? 'text-purple-700' : evGestiona ? 'text-teal-700' : evOnline ? 'text-sky-700' : (color?.text ?? 'text-slate-600')
                                )}>
                                  {ev.Actividad || ev.Sesión || ev.CÓDIGO || '—'}
                                </div>
                                {ev.Sesión && ev.Actividad && !evFestivo && !evEspublico && !evGestiona && (
                                  <div className={cn('text-[10px] opacity-70 truncate', color?.text ?? 'text-slate-500')}>
                                    {ev.Sesión}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          const top = (startMin - minHour * 60) / 60 * HOUR_HEIGHT
                          const durationMin = endMin !== null ? endMin - startMin : 60
                          const height = Math.max(24, durationMin / 60 * HOUR_HEIGHT)
                          const evOnline = isTipoOnline(ev.Tipo)

                          return (
                            <div
                              key={ei}
                              className={cn(
                                'absolute left-1 right-1 rounded px-2 py-1 border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity',
                                color ? `${color.bg} ${color.border}` : 'bg-slate-50 border-slate-200',
                                evOnline && 'border-l-4 border-l-sky-500'
                              )}
                              style={{ top: top + 1, height: height - 2 }}
                              onClick={() => onEventClick(ev)}
                            >
                              <div className={cn('flex items-center gap-1 text-[10px] font-medium leading-none mb-0.5 opacity-80', color?.text ?? 'text-slate-500')}>
                                {evOnline && <Wifi className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />}
                                <span>
                                  {ev['Hora inicio']?.slice(0, 5)}
                                  {ev['Hora fin'] ? ` – ${ev['Hora fin'].slice(0, 5)}` : ''}
                                </span>
                              </div>
                              <div className={cn('text-[11px] font-medium leading-tight', color?.text ?? 'text-slate-700')}>
                                {ev.Actividad || ev.CÓDIGO || '—'}
                              </div>
                              {height > 44 && ev.Sesión && (
                                <div className={cn('text-[10px] opacity-70 leading-tight truncate', color?.text ?? 'text-slate-500')}>
                                  {ev.Sesión}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────
function EventDetailModal({ event, colorMap, onClose }: {
  event: ParsedEvent
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onClose: () => void
}) {
  const color = colorMap.get(event.Convocatoria ?? '')

  const fields: { label: string; value: string | null; icon: React.ReactNode }[] = [
    { label: 'Código', value: event.CÓDIGO, icon: <Hash className="w-3.5 h-3.5" /> },
    { label: 'Convocatoria', value: event.Convocatoria, icon: <Layers className="w-3.5 h-3.5" /> },
    { label: 'Actividad', value: event.Actividad, icon: <Calendar className="w-3.5 h-3.5" /> },
    { label: 'Sesión', value: event.Sesión, icon: <Tag className="w-3.5 h-3.5" /> },
    { label: 'Tipo', value: event.Tipo, icon: <Tag className="w-3.5 h-3.5" /> },
    { label: 'Día', value: event['Día'], icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { label: 'Hora inicio', value: event['Hora inicio'], icon: <Clock className="w-3.5 h-3.5" /> },
    { label: 'Hora fin', value: event['Hora fin'], icon: <Clock className="w-3.5 h-3.5" /> },
    { label: 'Agente', value: event.Agente, icon: <User className="w-3.5 h-3.5" /> },
    { label: 'Agente 2', value: event['Agente 2'], icon: <User className="w-3.5 h-3.5" /> },
    { label: 'Agente 3', value: event['Agente 3'], icon: <User className="w-3.5 h-3.5" /> },
    { label: 'Agente 4', value: event['Agente 4'], icon: <User className="w-3.5 h-3.5" /> },
  ].filter(f => f.value)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-md animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('p-5 rounded-t-2xl border-b', color ? `${color.bg} ${color.border}` : 'bg-slate-50 border-slate-200')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn('text-xs mb-1 opacity-70', color?.text ?? 'text-slate-500')}>{event.Convocatoria}</p>
              <h2 className={cn('font-semibold text-lg leading-tight', color?.text ?? 'text-slate-800')}>
                {event.Actividad || event.CÓDIGO || 'Evento'}
              </h2>
              {event.Sesión && <p className={cn('text-sm mt-0.5 opacity-80', color?.text ?? 'text-slate-600')}>{event.Sesión}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/60 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-3">
          {fields.map(f => (
            <div key={f.label} className="flex items-start gap-3">
              <span className="text-slate-300 mt-0.5 flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-slate-400 text-xs">{f.label}</p>
                <p className="text-slate-700 text-sm">{f.value}</p>
              </div>
            </div>
          ))}
          {fields.length === 0 && <p className="text-slate-400 text-sm">Sin detalles adicionales</p>}
        </div>
      </div>
    </div>
  )
}

// ─── InputRow (standalone to avoid hook rules issues) ────────────────────────
function InputRow({ label, field, type = 'text', datalist, placeholder, formData, onUpdate }: {
  label: string
  field: keyof EventRow
  type?: string
  datalist?: string[]
  placeholder?: string
  formData: Partial<EventRow>
  onUpdate: (key: keyof EventRow, value: string) => void
}) {
  return (
    <div>
      <label className="text-slate-400 text-xs mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={type}
          list={datalist ? `dl-${String(field)}` : undefined}
          value={(formData[field] as string) ?? ''}
          onChange={e => onUpdate(field, e.target.value)}
          placeholder={placeholder}
          className="input-field text-sm"
        />
        {datalist && (
          <datalist id={`dl-${String(field)}`}>
            {datalist.map(v => <option key={v} value={v} />)}
          </datalist>
        )}
      </div>
    </div>
  )
}

// ─── Create Event Modal ───────────────────────────────────────────────────────
function CreateEventModal({ date, formData, convocatorias, tipos, saving, error, onUpdate, onSave, onClose }: {
  date: Date | null
  formData: Partial<EventRow>
  convocatorias: string[]
  tipos: string[]
  saving: boolean
  error: string | null
  onUpdate: (key: keyof EventRow, value: string) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 glass-card rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
              <Plus className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="text-slate-800 font-semibold">Nuevo Evento</h2>
              {date && (
                <p className="text-slate-400 text-xs">
                  {date.getDate()} {MONTHS_ES[date.getMonth()]} {date.getFullYear()}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InputRow label="ID" field="ID" placeholder="Ej: EVT-001" formData={formData} onUpdate={onUpdate} />
            <InputRow label="Código" field="CÓDIGO" placeholder="Ej: C-2024-01" formData={formData} onUpdate={onUpdate} />
          </div>

          <InputRow
            label="Convocatoria"
            field="Convocatoria"
            datalist={convocatorias}
            placeholder="Nombre de la convocatoria"
            formData={formData}
            onUpdate={onUpdate}
          />

          <InputRow label="Actividad" field="Actividad" placeholder="Nombre de la actividad" formData={formData} onUpdate={onUpdate} />
          <InputRow label="Sesión" field="Sesión" placeholder="Sesión o descripción" formData={formData} onUpdate={onUpdate} />

          <InputRow
            label="Tipo"
            field="Tipo"
            datalist={tipos}
            placeholder="Tipo de evento"
            formData={formData}
            onUpdate={onUpdate}
          />

          <div className="grid grid-cols-2 gap-3">
            <InputRow label="Día" field="Día" type="date" formData={formData} onUpdate={onUpdate} />
            <InputRow label="Día Mes" field="Día Mes" placeholder="Ej: 15 Ene" formData={formData} onUpdate={onUpdate} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputRow label="Hora inicio" field="Hora inicio" type="time" formData={formData} onUpdate={onUpdate} />
            <InputRow label="Hora fin" field="Hora fin" type="time" formData={formData} onUpdate={onUpdate} />
          </div>

          <InputRow label="Calendar" field="Calendar" placeholder="Referencia de calendario" formData={formData} onUpdate={onUpdate} />

          <div className="grid grid-cols-2 gap-3">
            <InputRow label="Agente" field="Agente" placeholder="Agente principal" formData={formData} onUpdate={onUpdate} />
            <InputRow label="Agente 2" field="Agente 2" placeholder="Agente 2" formData={formData} onUpdate={onUpdate} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputRow label="Agente 3" field="Agente 3" placeholder="Agente 3" formData={formData} onUpdate={onUpdate} />
            <InputRow label="Agente 4" field="Agente 4" placeholder="Agente 4" formData={formData} onUpdate={onUpdate} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-200 sticky bottom-0 glass-card rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
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
