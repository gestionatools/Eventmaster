'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Filter,
  RefreshCw, Search, Clock, User, Tag, Hash, Layers, CalendarDays, Download
} from 'lucide-react'
import { supabase, EventRow } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import { cn } from '@/lib/utils'

// ─── Color palette for convocatorias ──────────────────────────────────────────
const CONVOCATORIA_COLORS = [
  { bg: 'bg-blue-500/80',    border: 'border-blue-400',    text: 'text-blue-100',    dot: 'bg-blue-400',    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',    ring: 'bg-blue-400/40' },
  { bg: 'bg-violet-500/80',  border: 'border-violet-400',  text: 'text-violet-100',  dot: 'bg-violet-400',  badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',  ring: 'bg-violet-400/40' },
  { bg: 'bg-emerald-500/80', border: 'border-emerald-400', text: 'text-emerald-100', dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', ring: 'bg-emerald-400/40' },
  { bg: 'bg-amber-500/80',   border: 'border-amber-400',   text: 'text-amber-100',   dot: 'bg-amber-400',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',   ring: 'bg-amber-400/40' },
  { bg: 'bg-rose-500/80',    border: 'border-rose-400',    text: 'text-rose-100',    dot: 'bg-rose-400',    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',    ring: 'bg-rose-400/40' },
  { bg: 'bg-cyan-500/80',    border: 'border-cyan-400',    text: 'text-cyan-100',    dot: 'bg-cyan-400',    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',    ring: 'bg-cyan-400/40' },
  { bg: 'bg-orange-500/80',  border: 'border-orange-400',  text: 'text-orange-100',  dot: 'bg-orange-400',  badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',  ring: 'bg-orange-400/40' },
  { bg: 'bg-pink-500/80',    border: 'border-pink-400',    text: 'text-pink-100',    dot: 'bg-pink-400',    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',    ring: 'bg-pink-400/40' },
  { bg: 'bg-teal-500/80',    border: 'border-teal-400',    text: 'text-teal-100',    dot: 'bg-teal-400',    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',    ring: 'bg-teal-400/40' },
  { bg: 'bg-indigo-500/80',  border: 'border-indigo-400',  text: 'text-indigo-100',  dot: 'bg-indigo-400',  badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',  ring: 'bg-indigo-400/40' },
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
  normal:     { active: 'bg-amber-500/20 text-amber-300 border-amber-500/40',    dot: 'bg-amber-400' },
  analiza:    { active: 'bg-blue-500/20 text-blue-300 border-blue-500/40',       dot: 'bg-blue-400' },
  developers: { active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' },
}

// Presencial highlight style varies by convocatoria type
const PRESENCIAL_STYLES: Record<ConvocatoriaType, { cell: string; circle: string; ring: string }> = {
  normal:     { cell: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/60',  circle: 'bg-orange-500/80 ring-2 ring-orange-400',   ring: 'bg-orange-500/5' },
  analiza:    { cell: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/60',        circle: 'bg-blue-500/80 ring-2 ring-blue-400',       ring: 'bg-blue-500/5' },
  developers: { cell: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/60', circle: 'bg-emerald-500/80 ring-2 ring-emerald-400', ring: 'bg-emerald-500/5' },
}

function getPresencialStyle(convocatoria: string | null | undefined) {
  return PRESENCIAL_STYLES[getConvocatoriaType(convocatoria)]
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
type ViewMode = 'year' | 'month'

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

  // ── Navigation ──────────────────────────────────────────────────────────────
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const goBack = () => {
    const d = new Date(currentDate)
    if (viewMode === 'year') d.setFullYear(year - 1)
    else d.setMonth(month - 1)
    setCurrentDate(d)
  }
  const goForward = () => {
    const d = new Date(currentDate)
    if (viewMode === 'year') d.setFullYear(year + 1)
    else d.setMonth(month + 1)
    setCurrentDate(d)
  }
  const goToday = () => setCurrentDate(new Date())

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
        subtitle={viewMode === 'year' ? `${year}` : `${MONTHS_ES[month]} ${year}`}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Toolbar */}
      <div className="glass-card p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* View toggle */}
        <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('month')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              viewMode === 'month' ? 'bg-brand-500/30 text-brand-300 shadow-sm' : 'text-white/40 hover:text-white/70')}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Mes
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              viewMode === 'year' ? 'bg-brand-500/30 text-brand-300 shadow-sm' : 'text-white/40 hover:text-white/70')}
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
              ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
              : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80')}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {hasFilters && (
            <span className="w-4 h-4 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {filterConvocatoria.length + (filterTipo ? 1 : 0) + (filterCodigo ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Export ICS */}
        <button
          onClick={() => exportToICS(filteredEvents)}
          title="Exportar calendario (.ics) compatible con Outlook 365"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-white/5 text-white/50 border border-white/10 hover:text-white/80 hover:bg-white/10 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Exportar ICS
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
              <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1.5">
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
                        active ? `${color?.badge} border-current` : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
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
              <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1.5">
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
              <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Código
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
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
        <span className="text-white/30 text-xs uppercase tracking-wider mr-1">Tipo convocatoria:</span>
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
                  : 'bg-white/5 text-white/40 border-white/10 hover:text-white/70 hover:bg-white/10'
              )}
            >
              <span className={cn(
                'w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                active ? `${style.dot} border-current` : 'border-white/30'
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
            className="text-xs text-white/30 hover:text-white/60 ml-auto transition-all"
          >
            × limpiar
          </button>
        )}
      </div>

      {/* Color legend */}
      {convocatorias.length > 0 && (
        <div className="glass-card p-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-white/30 text-xs mr-1">Convocatorias:</span>
            {convocatorias.map(c => {
              const color = colorMap.get(c)
              return (
                <span key={c} className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border', color?.badge)}>
                  <span className={cn('w-2 h-2 rounded-full', color?.dot)} />
                  {c}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendar */}
      {loading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
          <span className="ml-3 text-white/40">Cargando eventos...</span>
        </div>
      ) : viewMode === 'year' ? (
        <YearView
          year={year}
          events={filteredEvents}
          colorMap={colorMap}
          onDayClick={openDayView}
          onCreateEvent={openCreate}
        />
      ) : (
        <MonthView
          year={year}
          month={month}
          events={filteredEvents}
          colorMap={colorMap}
          onDayClick={openDayView}
          onCreateEvent={openCreate}
          onEventClick={setSelectedEvent}
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
    </div>
  )
}

// ─── Year View ────────────────────────────────────────────────────────────────
function YearView({ year, events, colorMap, onDayClick, onCreateEvent }: {
  year: number
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onDayClick: (d: Date) => void
  onCreateEvent: (d: Date) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, mi) => (
        <MiniMonth
          key={mi}
          year={year}
          month={mi}
          events={events}
          colorMap={colorMap}
          onDayClick={onDayClick}
          onCreateEvent={onCreateEvent}
        />
      ))}
    </div>
  )
}

function MiniMonth({ year, month, events, colorMap, onDayClick, onCreateEvent }: {
  year: number
  month: number
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onDayClick: (d: Date) => void
  onCreateEvent: (d: Date) => void
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
        <h3 className="text-white/80 text-sm font-semibold">{MONTHS_ES[month]}</h3>
        <span className="text-white/30 text-xs">{monthEvents.length} ev.</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="text-white/25 text-[9px] text-center font-medium">{d[0]}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: Math.ceil(cells / 7) * 7 }, (_, i) => {
          const dayNum = i - startOffset + 1
          if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />
          const date = new Date(year, month, dayNum)
          const isToday = sameDay(date, today)
          const dayEvents = monthEvents.filter(e => e._date && sameDay(e._date, date))
          const colors = Array.from(new Set(dayEvents.map(e => colorMap.get(e.Convocatoria ?? '')?.dot).filter(Boolean))) as string[]
          const firstPresencial = dayEvents.find(e => (e.Tipo ?? '').toLowerCase().includes('presencial'))
          const hasPresencial = !!firstPresencial
          const presencialStyle = firstPresencial ? getPresencialStyle(firstPresencial.Convocatoria) : null

          return (
            <button
              key={i}
              onClick={() => onDayClick(date)}
              onDoubleClick={() => onCreateEvent(date)}
              title={`${dayNum} ${MONTHS_ES[month]} — ${dayEvents.length} evento(s)${dayEvents.length ? '\n' + dayEvents.map(e => e.Actividad || e.Convocatoria).join('\n') : ''}`}
              className={cn(
                'aspect-square rounded flex flex-col items-center justify-center relative transition-all hover:bg-white/10 group',
                isToday
                  ? 'bg-brand-500/30 text-brand-300 font-bold'
                  : hasPresencial
                    ? `font-semibold ${presencialStyle!.cell}`
                    : 'text-white/50'
              )}
            >
              <span className="text-[10px] leading-none">{dayNum}</span>
              {colors.length > 0 && (
                <div className="flex gap-px mt-0.5 flex-wrap justify-center max-w-full">
                  {colors.slice(0, 3).map((c, ci) => (
                    <span key={ci} className={cn('w-1 h-1 rounded-full', c)} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({ year, month, events, colorMap, onDayClick, onCreateEvent, onEventClick }: {
  year: number
  month: number
  events: ParsedEvent[]
  colorMap: Map<string, typeof CONVOCATORIA_COLORS[0]>
  onDayClick: (d: Date) => void
  onCreateEvent: (d: Date) => void
  onEventClick: (e: ParsedEvent) => void
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
      <div className="grid grid-cols-7 border-b border-white/10">
        {DAYS_ES.map(d => (
          <div key={d} className="py-3 text-center text-white/40 text-xs font-semibold uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-white/5">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - startOffset + 1
          const isOutside = dayNum < 1 || dayNum > daysInMonth
          if (isOutside) {
            return <div key={i} className="min-h-28 border-b border-white/5 bg-white/[0.02]" />
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
          const firstPresencial = dayEvents.find(e => (e.Tipo ?? '').toLowerCase().includes('presencial'))
          const hasPresencial = !!firstPresencial
          const presencialStyle = firstPresencial ? getPresencialStyle(firstPresencial.Convocatoria) : null

          return (
            <div
              key={i}
              onClick={() => onDayClick(date)}
              className={cn(
                'group min-h-28 border-b border-white/5 p-1.5 flex flex-col cursor-pointer',
                isToday ? 'bg-brand-500/5' : hasPresencial ? presencialStyle!.ring : 'hover:bg-white/[0.03]',
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium relative overflow-hidden transition-all',
                  isToday
                    ? 'bg-brand-500 text-white'
                    : hasPresencial
                      ? 'text-white'
                      : (firstColor ? 'text-white/90' : 'text-white/50')
                )}>
                  {/* Presencial: colored ring based on type */}
                  {!isToday && hasPresencial && (
                    <span className={cn('absolute inset-0 rounded-full', presencialStyle!.circle)} />
                  )}
                  {/* Regular event: subtle color ring */}
                  {!isToday && !hasPresencial && firstColor && (
                    <span className={cn('absolute inset-0 rounded-full', firstColor.ring)} />
                  )}
                  <span className="relative z-10">{dayNum}</span>
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCreateEvent(date) }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                  title="Crear evento"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-0.5 flex-1">
                {dayEvents.slice(0, 3).map((ev, ei) => {
                  const color = colorMap.get(ev.Convocatoria ?? '')
                  return (
                    <button
                      key={ei}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                      className={cn(
                        'w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-snug truncate border transition-all hover:opacity-80',
                        color ? `${color.bg} ${color.text} ${color.border}` : 'bg-white/10 text-white/60 border-white/20'
                      )}
                      title={ev.Actividad ?? ev.Convocatoria ?? ''}
                    >
                      {ev['Hora inicio'] && (
                        <span className="opacity-70 mr-1">{ev['Hora inicio'].slice(0, 5)}</span>
                      )}
                      {ev.Actividad || ev.Convocatoria || ev.CÓDIGO}
                    </button>
                  )
                })}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-white/30 text-left px-1.5">
                    +{dayEvents.length - 3} más
                  </span>
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
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider">
              {DAYS_FULL_ES[date.getDay()]}
            </p>
            <h2 className="text-white font-semibold text-xl">
              {date.getDate()} {MONTHS_ES[date.getMonth()]} {date.getFullYear()}
            </h2>
            <p className="text-white/30 text-xs mt-0.5">
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
            <button onClick={onClose} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {dayEvents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-white/30 gap-3">
            <CalendarDays className="w-10 h-10 opacity-30" />
            <p className="text-sm">No hay eventos este día</p>
            <button onClick={() => onCreateEvent(date)} className="btn-primary text-sm flex items-center gap-1.5 px-4 py-2 mt-2">
              <Plus className="w-3.5 h-3.5" /> Crear evento
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="flex min-h-full">
              {/* Time axis */}
              <div className="w-14 flex-shrink-0 border-r border-white/10 bg-white/[0.02]">
                {/* Space for column headers */}
                <div className="h-10" />
                {hours.map(h => (
                  <div key={h} className="relative border-t border-white/5" style={{ height: HOUR_HEIGHT }}>
                    <span className="absolute top-1 right-2 text-white/25 text-[10px] font-mono">
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
                    <div key={conv} className="flex-1 min-w-36 border-r border-white/5 last:border-r-0 flex flex-col">
                      {/* Column header */}
                      <div className={cn(
                        'h-10 flex items-center gap-1.5 px-3 border-b border-white/10 flex-shrink-0 sticky top-0',
                        color?.badge ?? 'bg-white/5 text-white/50 border-white/10'
                      )}>
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color?.dot ?? 'bg-white/30')} />
                        <span className="text-[11px] font-medium truncate">{conv}</span>
                        <span className="ml-auto text-[10px] opacity-60">{convEvents.length}</span>
                      </div>

                      {/* Time grid */}
                      <div className="relative flex-1" style={{ height: hours.length * HOUR_HEIGHT }}>
                        {/* Hour lines */}
                        {hours.map((h, hi) => (
                          <div
                            key={h}
                            className="absolute w-full border-t border-white/5"
                            style={{ top: hi * HOUR_HEIGHT }}
                          />
                        ))}

                        {/* Events */}
                        {convEvents.map((ev, ei) => {
                          const startMin = parseTimeToMinutes(ev['Hora inicio'])
                          const endMin = parseTimeToMinutes(ev['Hora fin'])

                          // Events without time: stack them at the top
                          if (startMin === null) {
                            return (
                              <div
                                key={ei}
                                className={cn(
                                  'mx-1 mb-1 rounded px-2 py-1 border cursor-pointer hover:opacity-90 transition-opacity',
                                  color ? `${color.bg} ${color.border}` : 'bg-white/10 border-white/20'
                                )}
                                style={{ marginTop: ei * 40 }}
                                onClick={() => onEventClick(ev)}
                              >
                                <div className={cn('text-[11px] font-medium truncate', color?.text ?? 'text-white/80')}>
                                  {ev.Actividad || ev.Sesión || ev.CÓDIGO || '—'}
                                </div>
                                {ev.Sesión && ev.Actividad && (
                                  <div className={cn('text-[10px] opacity-70 truncate', color?.text ?? 'text-white/60')}>
                                    {ev.Sesión}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          const top = (startMin - minHour * 60) / 60 * HOUR_HEIGHT
                          const durationMin = endMin !== null ? endMin - startMin : 60
                          const height = Math.max(24, durationMin / 60 * HOUR_HEIGHT)

                          return (
                            <div
                              key={ei}
                              className={cn(
                                'absolute left-1 right-1 rounded px-2 py-1 border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity',
                                color ? `${color.bg} ${color.border}` : 'bg-white/10 border-white/20'
                              )}
                              style={{ top: top + 1, height: height - 2 }}
                              onClick={() => onEventClick(ev)}
                            >
                              <div className={cn('text-[10px] font-medium leading-none mb-0.5 opacity-80', color?.text ?? 'text-white/60')}>
                                {ev['Hora inicio']?.slice(0, 5)}
                                {ev['Hora fin'] ? ` – ${ev['Hora fin'].slice(0, 5)}` : ''}
                              </div>
                              <div className={cn('text-[11px] font-medium leading-tight', color?.text ?? 'text-white/80')}>
                                {ev.Actividad || ev.CÓDIGO || '—'}
                              </div>
                              {height > 44 && ev.Sesión && (
                                <div className={cn('text-[10px] opacity-70 leading-tight truncate', color?.text ?? 'text-white/60')}>
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
        <div className={cn('p-5 rounded-t-2xl border-b border-white/10', color?.bg ?? 'bg-white/10')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/60 text-xs mb-1">{event.Convocatoria}</p>
              <h2 className="text-white font-semibold text-lg leading-tight">
                {event.Actividad || event.CÓDIGO || 'Evento'}
              </h2>
              {event.Sesión && <p className="text-white/70 text-sm mt-0.5">{event.Sesión}</p>}
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-3">
          {fields.map(f => (
            <div key={f.label} className="flex items-start gap-3">
              <span className="text-white/30 mt-0.5 flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-white/30 text-xs">{f.label}</p>
                <p className="text-white/80 text-sm">{f.value}</p>
              </div>
            </div>
          ))}
          {fields.length === 0 && <p className="text-white/30 text-sm">Sin detalles adicionales</p>}
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
      <label className="text-white/40 text-xs mb-1 block">{label}</label>
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
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 glass-card rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500/20 rounded-xl flex items-center justify-center">
              <Plus className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Nuevo Evento</h2>
              {date && (
                <p className="text-white/40 text-xs">
                  {date.getDate()} {MONTHS_ES[date.getMonth()]} {date.getFullYear()}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10">
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-white/10 sticky bottom-0 glass-card rounded-b-2xl">
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
