export type Locale = 'en' | 'es';

const messages = {
  en: {
    today: 'Today',
    thisWeek: 'This week',
    thisMonth: 'This month',
    revenue: 'Revenue',
    completed: 'Completed',
    completedServices: 'Completed services',
    servicesDone: 'Services done',
    dashboard: 'Dashboard',
    leads: 'Leads',
    bookings: 'Bookings',
    professionals: 'Professionals',
    liveMap: 'Live Map',
    summary: 'Summary',
    logout: 'Log out',
    closeSession: 'Close session',
  },
  es: {
    today: 'Hoy',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
    revenue: 'Ingresos',
    completed: 'Completado',
    completedServices: 'Servicios completados',
    servicesDone: 'Servicios realizados',
    dashboard: 'Dashboard',
    leads: 'Leads',
    bookings: 'Bookings',
    professionals: 'Profesionales',
    liveMap: 'Mapa en vivo',
    summary: 'Resumen',
    logout: 'Cerrar sesión',
    closeSession: 'Cerrar sesión',
  },
} as const;

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'es';
  const saved = window.localStorage.getItem('locale');
  return saved === 'en' ? 'en' : 'es';
}

export function t(locale: Locale, key: keyof typeof messages.en): string {
  return messages[locale][key] ?? messages.es[key];
}
