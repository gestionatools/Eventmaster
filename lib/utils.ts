import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const statusColors = {
  upcoming: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ongoing: 'bg-green-500/20 text-green-300 border-green-500/30',
  completed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  registered: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
  attended: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
}

export const statusLabels = {
  upcoming: 'Próximo',
  ongoing: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
  registered: 'Registrado',
  confirmed: 'Confirmado',
  attended: 'Asistió',
}
