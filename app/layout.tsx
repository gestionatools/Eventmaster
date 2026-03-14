import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EventMaster — Gestión de Eventos',
  description: 'Plataforma moderna para la gestión y visualización de eventos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
