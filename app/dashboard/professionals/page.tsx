'use client';
import { useEffect, useState } from 'react';
import { getLocale, t } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<'en' | 'es'>('es');

  useEffect(() => {
    setLocale(getLocale());
    const token = localStorage.getItem('token') || '';
    api.professionals.list(token).then(data => {
      setProfessionals(data.data || []);
      setTotal(data.total || 0);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className='text-xl font-medium text-gray-900 mb-6'>Profesionales ({total})</h1>
      <div className='grid grid-cols-2 gap-4'>
        {loading
          ? <p className='text-gray-400 col-span-2 text-center py-8'>Cargando...</p>
          : professionals.length === 0
          ? <p className='text-gray-400 col-span-2 text-center py-8'>Sin profesionales</p>
          : professionals.map((pro) => {
            const name = pro.fullName || pro.full_name || 'Profesional';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
            const rating = Number(pro.avgRating || pro.avg_rating || 0).toFixed(1);
            const services = pro.totalServices ?? pro.total_services ?? 0;
            const radius = pro.serviceRadiusMiles || pro.service_radius_miles || 0;
            const available = pro.isAvailable || pro.is_available || false;
            return (
              <div key={pro.id} className='bg-white rounded-xl border border-gray-200 p-4'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm'>
                    {initials}
                  </div>
                  <div>
                    <p className='font-medium text-gray-900 text-sm'>{name}</p>
                    <p className='text-xs text-gray-400'>{t(locale, 'radius')}: {radius} mi</p>
                  </div>
                  <span className={'ml-auto text-xs px-2 py-0.5 rounded-full ' + (available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                    {available ? t(locale, 'available') : t(locale, 'unavailable')}
                  </span>
                </div>
                <div className='flex gap-4 text-xs text-gray-500'>
                  <span>{t(locale, 'rating')}: {rating}</span>
                  <span>{services} {t(locale, 'services')}</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
