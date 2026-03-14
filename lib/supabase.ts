import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type EventRow = {
  ID: string
  CÓDIGO: string | null
  Convocatoria: string | null
  Actividad: string | null
  Sesión: string | null
  Tipo: string | null
  Día: string | null
  'Día Mes': string | null
  'Hora inicio': string | null
  'Hora fin': string | null
  Calendar: string | null
  Agente: string | null
  'Agente 2': string | null
  'Agente 3': string | null
  'Agente 4': string | null
}

export type Database = {
  public: {
    Tables: {
      eventmaster_main: {
        Row: EventRow
        Insert: EventRow
        Update: Partial<EventRow>
      }
    }
  }
}
