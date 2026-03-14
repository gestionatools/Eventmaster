'use client'

import React, { useState, useMemo } from 'react'
import {
  X, ChevronLeft, ChevronRight, Calendar, CalendarDays,
  Check, RefreshCw, MapPin,
} from 'lucide-react'
import { supabase, EventRow } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { DAY_SLOTS, TEMPLATE_EVENTS } from './CreateConvocatoriaModal'

// ─── Types ────────────────────────────────────────────────────────────────────
type ParsedEvent = EventRow & { _date: Date | null }

type ColorEntry = {
  bg: string; border: string; text: string
  dot: string; badge: string; ring: string
}

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
  existingEvents: ParsedEvent[]
  colorMap: Map<string, ColorEntry>
  onClose: () => void
  onSuccess: () => void
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function CalendarEventModal({ existingEvents, colorMap, onClose, onSuccess }: Props) {
  const [convName, setConvName]       = useState('')
  const [viewMode, setViewMode]       = useState<'month' | 'year'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string>(DAY_SLOTS[0].id)
  const [slotDates, setSlotDates]     = useState<Record<string, string>>({})
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

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

  // Index of existing events by ISO date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ParsedEvent[]>()
    existingEvents.forEach(e => {
      if (!e._date) return
      const key = toISO(e._date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    })
    return map
  }, [existingEvents])

  // Index of slot assignments by ISO date
  const assignedDateMap = useMemo(() => {
    const map = new Map<string, string[]>()
    ;(Object.entries(slotDates) as [string, string][]).forEach(([slotId, date]) => {
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(slotId)
    })
    return map
  }, [slotDates])

  const handleDayClick = (date: Date) => {
    if (!selectedSlot) return
    const iso = toISO(date)
    const newSlotDates = { ...slotDates, [selectedSlot]: iso }
    setSlotDates(newSlotDates)
    // Auto-advance to next unassigned slot
    const next = DAY_SLOTS.find(s => s.id !== selectedSlot && !newSlotDates[s.id])
    if (next) setSelectedSlot(next.id)
  }

  const removeSlot = (slotId: string) => {
    setSlotDates((prev: Record<string, string>) => {
      const n = { ...prev }
      delete n[slotId]
      return n
    })
  }

  const assignedCount = Object.keys(slotDates).length

  const handleSave = async () => {
    if (!convName.trim()) { setSaveError('Introduce un nombre para la convocatoria'); return }
    setSaving(true)
    setSaveError(null)
    try {
      const ts = Date.now()
      const rows = TEMPLATE_EVENTS.map((ev, idx) => {
        const isoDate = slotDates[ev.slotId] ?? null
        let diaMes: string | null = null
        if (isoDate) {
          const d = new Date(isoDate + 'T00:00:00')
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
          'Hora fin':    ev['Hora fin']    || null,
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

  const selectedSlotLabel = DAY_SLOTS.find(s => s.id === selectedSlot)?.label ?? ''

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-7xl mx-4 my-4 flex flex-col overflow-hidden rounded-2xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-shrink-0">
          <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <h2 className="text-white font-semibold text-base whitespace-nowrap">Nueva Convocatoria</h2>

          <input
            type="text"
            placeholder="Nombre de la convocatoria..."
            value={convName}
            onChange={e => setConvName(e.target.value)}
            className="input-field text-sm py-1.5 w-64 flex-shrink-0"
          />

          <div className="flex-1" />

          {/* View toggle */}
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

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all ml-1 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Calendar */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'month' ? (
              <MonthGrid
                year={year}
                month={month}
                eventsByDate={eventsByDate}
                assignedDateMap={assignedDateMap}
                selectedSlot={selectedSlot}
                slotDates={slotDates}
                colorMap={colorMap}
                onDayClick={handleDayClick}
              />
            ) : (
              <YearGrid
                year={year}
                eventsByDate={eventsByDate}
                assignedDateMap={assignedDateMap}
                selectedSlot={selectedSlot}
                slotDates={slotDates}
                colorMap={colorMap}
                onDayClick={handleDayClick}
              />
            )}
          </div>

          {/* ── Template slots sidebar ── */}
          <div className="w-72 border-l border-white/10 flex flex-col flex-shrink-0 overflow-hidden">
            {/* Sidebar header */}
            <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-xs uppercase tracking-wider">Plantilla</span>
                <span className="text-white/40 text-xs">{assignedCount}/{DAY_SLOTS.length}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(assignedCount / DAY_SLOTS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Slots list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {DAY_SLOTS.map(slot => {
                const assigned = slotDates[slot.id]
                const isSelected = selectedSlot === slot.id
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-start gap-2 border',
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : assigned
                        ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/8'
                        : 'bg-transparent text-white/35 border-transparent hover:bg-white/5 hover:text-white/55'
                    )}
                  >
                    {/* Status dot */}
                    <span className={cn(
                      'w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                      assigned
                        ? 'bg-emerald-500'
                        : isSelected
                        ? 'ring-2 ring-emerald-400 bg-emerald-500/30 animate-pulse'
                        : 'bg-white/10'
                    )}>
                      {assigned && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight truncate">{slot.label}</div>
                      {slot.suggestedDay && !assigned && (
                        <div className="text-[10px] opacity-50 mt-0.5">{slot.suggestedDay}</div>
                      )}
                      {assigned && (
                        <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
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
                        onClick={e => { e.stopPropagation(); removeSlot(slot.id) }}
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

        {/* ── Footer ── */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-white/10 flex-shrink-0">
          {saveError ? (
            <p className="text-red-400 text-sm">{saveError}</p>
          ) : (
            <p className="text-white/30 text-xs truncate flex-1">
              {selectedSlot
                ? `Haz clic en un día para asignar: ${selectedSlotLabel}`
                : 'Selecciona un bloque de la plantilla'}
            </p>
          )}
          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !convName.trim()}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Check className="w-4 h-4" />}
              Crear convocatoria
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Month grid ───────────────────────────────────────────────────────────────
function MonthGrid({
  year, month, eventsByDate, assignedDateMap, selectedSlot, slotDates, colorMap, onDayClick,
}: {
  year: number
  month: number
  eventsByDate: Map<string, ParsedEvent[]>
  assignedDateMap: Map<string, string[]>
  selectedSlot: string
  slotDates: Record<string, string>
  colorMap: Map<string, ColorEntry>
  onDayClick: (d: Date) => void
}) {
  const today      = new Date()
  const firstDay   = new Date(year, month, 1)
  const startOff   = (firstDay.getDay() + 6) % 7
  const daysInMo   = new Date(year, month + 1, 0).getDate()
  const selectedAssigned = selectedSlot ? slotDates[selectedSlot] : null

  const cells: (number | null)[] = [
    ...Array(startOff).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1),
  ]

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="text-center text-xs text-white/25 py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const date      = new Date(year, month, day)
          const iso       = toISO(date)
          const existing  = eventsByDate.get(iso) ?? []
          const newSlots  = assignedDateMap.get(iso) ?? []
          const isToday   = date.toDateString() === today.toDateString()
          const isTarget  = selectedAssigned === iso  // current slot's assigned date

          return (
            <button
              key={i}
              onClick={() => onDayClick(date)}
              title={`Asignar ${DAY_SLOTS.find(s => s.id === selectedSlot)?.label ?? ''}`}
              className={cn(
                'h-16 rounded-lg p-1.5 flex flex-col items-center transition-all border group',
                isTarget
                  ? 'bg-emerald-500/25 border-emerald-400/50 shadow-[0_0_0_2px_rgba(52,211,153,0.3)]'
                  : newSlots.length > 0
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : isToday
                  ? 'bg-brand-500/20 border-brand-500/30'
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/8 hover:border-emerald-500/30'
              )}
            >
              <span className={cn(
                'text-sm font-medium leading-none',
                isTarget ? 'text-emerald-300' : isToday ? 'text-brand-300' : 'text-white/70 group-hover:text-white/90'
              )}>
                {day}
              </span>

              {/* Existing event dots */}
              {existing.length > 0 && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                  {existing.slice(0, 5).map((ev, j) => {
                    const col = colorMap.get(ev.Convocatoria ?? '')
                    return (
                      <span
                        key={j}
                        className={cn('w-1.5 h-1.5 rounded-full opacity-50', col?.dot ?? 'bg-white/20')}
                        title={ev.Convocatoria ?? ''}
                      />
                    )
                  })}
                  {existing.length > 5 && (
                    <span className="text-white/20 text-[8px] leading-none">+{existing.length - 5}</span>
                  )}
                </div>
              )}

              {/* New slot labels */}
              {newSlots.length > 0 && (
                <div className="w-full mt-auto space-y-px">
                  {newSlots.map(slotId => {
                    const slot = DAY_SLOTS.find(s => s.id === slotId)
                    const label = slot?.label.split('–')[0].trim() ?? ''
                    return (
                      <div key={slotId} className="text-[8px] text-emerald-300 truncate text-center leading-tight bg-emerald-500/20 rounded px-0.5">
                        {label}
                      </div>
                    )
                  })}
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
function YearGrid({
  year, eventsByDate, assignedDateMap, selectedSlot, slotDates, colorMap, onDayClick,
}: {
  year: number
  eventsByDate: Map<string, ParsedEvent[]>
  assignedDateMap: Map<string, string[]>
  selectedSlot: string
  slotDates: Record<string, string>
  colorMap: Map<string, ColorEntry>
  onDayClick: (d: Date) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, mi) => (
        <MiniMonthGrid
          key={mi}
          year={year}
          month={mi}
          eventsByDate={eventsByDate}
          assignedDateMap={assignedDateMap}
          selectedSlot={selectedSlot}
          slotDates={slotDates}
          colorMap={colorMap}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  )
}

// ─── Mini-month for year view ─────────────────────────────────────────────────
function MiniMonthGrid({
  year, month, eventsByDate, assignedDateMap, selectedSlot, slotDates, colorMap, onDayClick,
}: {
  year: number
  month: number
  eventsByDate: Map<string, ParsedEvent[]>
  assignedDateMap: Map<string, string[]>
  selectedSlot: string
  slotDates: Record<string, string>
  colorMap: Map<string, ColorEntry>
  onDayClick: (d: Date) => void
}) {
  const today    = new Date()
  const firstDay = new Date(year, month, 1)
  const startOff = (firstDay.getDay() + 6) % 7
  const daysInMo = new Date(year, month + 1, 0).getDate()
  const selectedAssigned = selectedSlot ? slotDates[selectedSlot] : null

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
          const existing = eventsByDate.get(iso) ?? []
          const newSlots = assignedDateMap.get(iso) ?? []
          const isToday  = date.toDateString() === today.toDateString()
          const isTarget = selectedAssigned === iso

          // Dominant color from existing events
          const firstEv  = existing[0]
          const dotColor = firstEv ? (colorMap.get(firstEv.Convocatoria ?? '')?.dot ?? '') : ''

          return (
            <button
              key={i}
              onClick={() => onDayClick(date)}
              className={cn(
                'aspect-square rounded flex items-center justify-center text-[10px] font-medium transition-all relative',
                isTarget
                  ? 'bg-emerald-500/40 text-emerald-200 ring-1 ring-emerald-400'
                  : newSlots.length > 0
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : isToday
                  ? 'bg-brand-500/30 text-brand-300'
                  : existing.length > 0
                  ? 'text-white/70 hover:bg-emerald-500/20 hover:text-emerald-300'
                  : 'text-white/35 hover:bg-white/8 hover:text-white/70'
              )}
              title={`${day} ${MONTHS_ES[month]} ${year}`}
            >
              {day}
              {/* Event indicator dot */}
              {existing.length > 0 && !isTarget && !newSlots.length && (
                <span className={cn('absolute bottom-0 right-0 w-1 h-1 rounded-full', dotColor || 'bg-white/30')} />
              )}
              {newSlots.length > 0 && (
                <span className="absolute bottom-0 right-0 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
