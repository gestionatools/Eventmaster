'use client'

import { useState } from 'react'
import { Settings, Database, Globe, Key, Check, ExternalLink } from 'lucide-react'
import TopBar from '@/components/TopBar'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isConnected = !!supabaseUrl && supabaseUrl !== 'your_supabase_project_url'

  return (
    <div className="animate-fade-in max-w-2xl">
      <TopBar
        title="Configuración"
        subtitle="Gestiona la configuración de tu aplicación"
      />

      <div className="space-y-6">
        {/* Connection Status */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-brand-400" />
            Estado de Conexión
          </h2>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse-slow' : 'bg-red-400'}`} />
            <div>
              <p className="text-white text-sm font-medium">
                Supabase {isConnected ? 'Conectado' : 'No configurado'}
              </p>
              {isConnected ? (
                <p className="text-white/40 text-xs mt-0.5 truncate">{supabaseUrl}</p>
              ) : (
                <p className="text-white/40 text-xs mt-0.5">Configura las variables de entorno</p>
              )}
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-brand-400" />
            Variables de Entorno
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">NEXT_PUBLIC_SUPABASE_URL</label>
              <div className="input-field flex items-center gap-2 cursor-not-allowed opacity-50">
                <span className="text-white/70 text-sm truncate">
                  {supabaseUrl || 'No configurado'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 block">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
              <div className="input-field flex items-center gap-2 cursor-not-allowed opacity-50">
                <span className="text-white/70 text-sm">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••••••••••' : 'No configurado'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl text-sm text-white/60">
            <p className="font-medium text-brand-300 mb-1">Cómo configurar</p>
            <p>Crea un archivo <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env.local</code> con tus credenciales de Supabase, o configura las variables en tu panel de Vercel.</p>
          </div>
        </div>

        {/* Database Setup */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-brand-400" />
            Configuración de Base de Datos
          </h2>

          <p className="text-white/50 text-sm mb-4">
            Ejecuta el siguiente SQL en tu proyecto de Supabase para crear las tablas necesarias:
          </p>

          <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-green-300 overflow-x-auto scrollbar-thin">
{`-- Tabla de Eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  capacity INTEGER,
  status TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Asistentes
CREATE TABLE IF NOT EXISTS attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'registered'
    CHECK (status IN ('registered','confirmed','cancelled','attended')),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (ajustar según necesidades)
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Public delete events" ON events FOR DELETE USING (true);

CREATE POLICY "Public read attendees" ON attendees FOR SELECT USING (true);
CREATE POLICY "Public insert attendees" ON attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update attendees" ON attendees FOR UPDATE USING (true);
CREATE POLICY "Public delete attendees" ON attendees FOR DELETE USING (true);`}
          </pre>
        </div>

        {/* Links */}
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-brand-400" />
            Recursos útiles
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Supabase Dashboard', url: 'https://app.supabase.com' },
              { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard' },
              { label: 'Documentación de Supabase', url: 'https://supabase.com/docs' },
            ].map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
              >
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">{link.label}</span>
                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          {saved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          {saved ? 'Guardado!' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}
