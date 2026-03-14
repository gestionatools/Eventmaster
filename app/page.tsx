import Link from 'next/link'
import { Calendar, Users, Database, Zap, ArrowRight, BarChart3, Shield, Globe } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Gestión de Eventos',
    description: 'Crea, edita y administra todos tus eventos desde un solo lugar con una interfaz intuitiva.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/20',
  },
  {
    icon: Users,
    title: 'Control de Asistentes',
    description: 'Registra y gestiona asistentes, controla el estado de confirmación y asistencia.',
    color: 'text-accent-400',
    bg: 'bg-accent-500/20',
  },
  {
    icon: Database,
    title: 'Visualización de Datos',
    description: 'Explora tu base de datos en tiempo real con una interfaz limpia y potente.',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
  {
    icon: BarChart3,
    title: 'Estadísticas en Tiempo Real',
    description: 'Dashboard con métricas clave y estadísticas actualizadas automáticamente.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
  },
  {
    icon: Shield,
    title: 'Seguro con Supabase',
    description: 'Autenticación robusta y Row Level Security para proteger tus datos.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/20',
  },
  {
    icon: Globe,
    title: 'Deploy en Vercel',
    description: 'Aplicación desplegada globalmente con CDN y performance optimizado.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">EventMaster</span>
        </div>
        <Link href="/dashboard" className="btn-primary text-sm flex items-center gap-2">
          Ir al Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Supabase + Vercel
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Gestiona tus{' '}
            <span className="gradient-text">eventos</span>
            <br />
            con precisión
          </h1>

          <p className="text-white/50 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Plataforma moderna para crear, gestionar y analizar eventos.
            Diseñada con Next.js, Supabase y Vercel para máximo rendimiento.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
              Empezar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard/settings" className="btn-secondary text-base px-8 py-4">
              Ver configuración
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-20 max-w-2xl mx-auto">
          {[
            { value: '100%', label: 'Open Source' },
            { value: '< 1s', label: 'Time to Interactive' },
            { value: '∞', label: 'Escalabilidad' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-white/40 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Una suite completa de herramientas para gestionar eventos profesionalmente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="glass-card-hover p-6 group">
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-brand-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center max-w-3xl mx-auto">
        <div className="glass-card p-12">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/30 animate-float">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Listo para empezar
          </h2>
          <p className="text-white/50 mb-8">
            Configura tu base de datos en Supabase y empieza a gestionar eventos en minutos
          </p>
          <Link href="/dashboard" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
            Abrir Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-white/10">
        <p className="text-white/30 text-sm">
          EventMaster — Construido con Next.js, Supabase y Vercel
        </p>
      </footer>
    </div>
  )
}
