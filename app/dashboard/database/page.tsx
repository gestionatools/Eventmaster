'use client'

import { useEffect, useState, useCallback } from 'react'
import { Database, Table, RefreshCw, ChevronDown, ChevronRight, Search, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/TopBar'

const TABLE_NAME = 'eventmaster_main'

export default function DatabasePage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const PAGE_SIZE = 1000
      let allRows: Record<string, unknown>[] = []
      let from = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .range(from, from + PAGE_SIZE - 1)

        if (error) throw error

        const fetched = data || []
        allRows = allRows.concat(fetched)
        hasMore = fetched.length === PAGE_SIZE
        from += PAGE_SIZE
      }

      setRows(allRows)
      setColumns(allRows.length > 0 ? Object.keys(allRows[0]) : [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
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

  const copyCell = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedCell(value)
    setTimeout(() => setCopiedCell(null), 2000)
  }

  const filteredRows = search
    ? rows.filter(row =>
        Object.values(row).some(v =>
          String(v ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Base de Datos"
        subtitle="eventmaster_main"
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Search */}
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar datos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <Table className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-left">
              <h2 className="text-slate-800 font-semibold">{TABLE_NAME}</h2>
              <p className="text-slate-400 text-xs">
                {loading ? 'Cargando...' : `${filteredRows.length} registros • ${columns.length} columnas`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
            {!loading && (
              <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs rounded-lg border border-brand-200">
                {filteredRows.length}
              </span>
            )}
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-slate-200">
            {loading ? (
              <div className="p-6 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-red-600 text-sm">
                <p className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Error: {error}
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  Asegúrate de que la tabla existe en Supabase
                </p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {search ? 'No hay resultados para la búsqueda' : 'La tabla está vacía'}
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {columns.map(col => (
                        <th
                          key={col}
                          className="text-left text-slate-400 text-xs font-medium px-4 py-3 whitespace-nowrap uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors group"
                      >
                        {columns.map(col => {
                          const value = row[col]
                          const displayValue = value === null || value === undefined ? '' : String(value)
                          const isNull = value === null || value === undefined
                          const isLong = displayValue.length > 40

                          return (
                            <td key={col} className="px-4 py-3 max-w-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`truncate ${isNull ? 'text-slate-300 italic' : 'text-slate-700'}`}
                                  title={isLong ? displayValue : undefined}
                                >
                                  {isNull ? 'null' : isLong ? displayValue.slice(0, 40) + '...' : displayValue}
                                </span>
                                {!isNull && (
                                  <button
                                    onClick={() => copyCell(displayValue)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  >
                                    {copiedCell === displayValue ? (
                                      <Check className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                                    )}
                                  </button>
                                )}
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
    </div>
  )
}
