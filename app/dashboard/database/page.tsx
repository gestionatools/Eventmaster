'use client'

import { useEffect, useState, useCallback } from 'react'
import { Database, Table, RefreshCw, ChevronDown, ChevronRight, Search, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'

interface TableData {
  name: string
  rows: Record<string, unknown>[]
  columns: string[]
  loading: boolean
  error: string | null
  expanded: boolean
}

const TABLES = ['events', 'attendees']

export default function DatabasePage() {
  const [tables, setTables] = useState<TableData[]>(
    TABLES.map(name => ({ name, rows: [], columns: [], loading: true, error: null, expanded: true }))
  )
  const [search, setSearch] = useState('')
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTable = useCallback(async (tableName: string) => {
    setTables(prev => prev.map(t =>
      t.name === tableName ? { ...t, loading: true, error: null } : t
    ))
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100)

      if (error) throw error

      const rows = data || []
      const columns = rows.length > 0 ? Object.keys(rows[0]) : []

      setTables(prev => prev.map(t =>
        t.name === tableName ? { ...t, rows, columns, loading: false } : t
      ))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setTables(prev => prev.map(t =>
        t.name === tableName ? { ...t, loading: false, error: message } : t
      ))
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setRefreshing(true)
    await Promise.all(TABLES.map(fetchTable))
    setRefreshing(false)
  }, [fetchTable])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const toggleTable = (name: string) => {
    setTables(prev => prev.map(t => t.name === name ? { ...t, expanded: !t.expanded } : t))
  }

  const copyCell = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedCell(value)
    setTimeout(() => setCopiedCell(null), 2000)
  }

  const filteredTables = tables.map(t => ({
    ...t,
    rows: search
      ? t.rows.filter(row =>
          Object.values(row).some(v =>
            String(v).toLowerCase().includes(search.toLowerCase())
          )
        )
      : t.rows,
  }))

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Base de Datos"
        subtitle="Visualización en tiempo real"
        onRefresh={fetchAll}
        isRefreshing={refreshing}
      />

      {/* Search */}
      <div className="glass-card p-4 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar datos en todas las tablas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tables */}
      <div className="space-y-6">
        {filteredTables.map((table) => (
          <div key={table.name} className="glass-card overflow-hidden">
            {/* Table Header */}
            <button
              onClick={() => toggleTable(table.name)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-500/20 rounded-xl flex items-center justify-center">
                  <Table className="w-4 h-4 text-brand-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-white font-semibold">{table.name}</h2>
                  <p className="text-white/40 text-xs">
                    {table.loading ? 'Cargando...' : `${table.rows.length} registros • ${table.columns.length} columnas`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {table.loading && <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />}
                {!table.loading && (
                  <span className="px-2.5 py-1 bg-brand-500/20 text-brand-300 text-xs rounded-lg border border-brand-500/30">
                    {table.rows.length}
                  </span>
                )}
                {table.expanded ? (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/40" />
                )}
              </div>
            </button>

            {/* Table Content */}
            {table.expanded && (
              <div className="border-t border-white/10">
                {table.loading ? (
                  <div className="p-6 space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                ) : table.error ? (
                  <div className="p-6 text-red-400 text-sm">
                    <p className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Error: {table.error}
                    </p>
                    <p className="text-white/30 text-xs mt-2">
                      Asegúrate de que la tabla existe en Supabase
                    </p>
                  </div>
                ) : table.rows.length === 0 ? (
                  <div className="p-8 text-center text-white/30 text-sm">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {search ? 'No hay resultados para la búsqueda' : 'La tabla está vacía'}
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          {table.columns.map(col => (
                            <th
                              key={col}
                              className="text-left text-white/40 text-xs font-medium px-4 py-3 whitespace-nowrap uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="border-t border-white/5 hover:bg-white/5 transition-colors group"
                          >
                            {table.columns.map(col => {
                              const value = row[col]
                              const displayValue = value === null ? 'null' : String(value)
                              const isNull = value === null
                              const isLong = displayValue.length > 40

                              return (
                                <td key={col} className="px-4 py-3 max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`truncate ${
                                        isNull ? 'text-white/20 italic' : 'text-white/80'
                                      }`}
                                      title={isLong ? displayValue : undefined}
                                    >
                                      {isLong ? displayValue.slice(0, 40) + '...' : displayValue}
                                    </span>
                                    <button
                                      onClick={() => copyCell(displayValue)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    >
                                      {copiedCell === displayValue ? (
                                        <Check className="w-3 h-3 text-green-400" />
                                      ) : (
                                        <Copy className="w-3 h-3 text-white/30 hover:text-white/60" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
