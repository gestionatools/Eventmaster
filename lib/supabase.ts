import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          location: string | null
          capacity: number | null
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          category: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      attendees: {
        Row: {
          id: string
          event_id: string
          name: string
          email: string
          status: 'registered' | 'confirmed' | 'cancelled' | 'attended'
          registered_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendees']['Row'], 'id' | 'registered_at'>
        Update: Partial<Database['public']['Tables']['attendees']['Insert']>
      }
    }
  }
}
