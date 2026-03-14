'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, Users, Hash, Layers, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { supabase, EventRow } from '@/lib/supabase'
import StatCard from '@/components/StatCard'
import TopBar from '@/components/TopBar'

interface DashboardStats {
  totalEventos: number
  totalConvocatorias: number
  totalAgentes: number
  totalTipos: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('eventmaster_main')
        .select('*')
        .order('ID', { ascending: false })
        .limit(200)

      if (error) throw error

      const rows: EventRow[] = data || []

      const convocatorias = new Set(rows.map(r => r.Convocatoria).filter(Boolean))
      const agentes = new Set([
        ...rows.map(r => r.Agente),
        ...rows.map(r => r['Agente 2']),
        ...rows.map(r => r['Agente 3']),
        ...rows.map(r => r['Agente 4']),
      ].filter(Boolean))
      const tipos = new Set(rows.map(r => r.Tipo).filter(Boolean))

      setStats({
        totalEventos: rows.length,
        totalConvocatorias: convocatorias.size,
        totalAgentes: agentes.size,
        totalTipos: tipos.size,
      })

      setRecentEvents(rows.slice(0, 10))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Dashboard"
        subtitle="EventMaster"
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Eventos"
          value={stats?.totalEventos ?? 0}
          icon={Calendar}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Convocatorias"
          value={stats?.totalConvocatorias ?? 0}
          icon={Layers}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Agentes"
          value={stats?.totalAgentes ?? 0}
          icon={Users}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Tipos"
          value={stats?.totalTipos ?? 0}
          icon={Hash}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Recent Events */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Eventos Recientes</h2>
            <p className="text-white/40 text-sm mt-0.5">Últimos registros de la base de datos</p>
          </div>
          <Link href="/dashboard/database" className="btn-ghost flex items-center gap-2 text-sm">
            Ver base de datos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/50 text-lg font-medium">Sin datos</p>
            <p className="text-white/30 text-sm mt-2">No se encontraron eventos en la base de datos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.ID} className="glass-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500/30 to-accent-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {event.Actividad || '—'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {event.Convocatoria && (
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {event.Convocatoria}
                      </span>
                    )}
                    {event['Hora inicio'] && (
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event['Hora inicio']}{event['Hora fin'] ? ` – ${event['Hora fin']}` : ''}
                      </span>
                    )}
                    {event.Agente && (
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.Agente}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {event.Tipo && (
                    <span className="px-2.5 py-1 bg-brand-500/20 text-brand-300 text-xs rounded-lg border border-brand-500/30">
                      {event.Tipo}
                    </span>
                  )}
                  {event['Día Mes'] && (
                    <span className="text-white/30 text-xs hidden sm:block">{event['Día Mes']}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
