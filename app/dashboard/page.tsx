'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export default function DashboardPage() {
  const [stats, setStats] = useState({ leads: 0, bookings: 0, professionals: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    Promise.all([api.leads.list(token), api.bookings.list(token), api.professionals.list(token)])
      .then(([leads, bookings, professionals]) => {
        setStats({ leads: leads.total || 0, bookings: bookings.total || 0, professionals: professionals.total || 0 });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);
  const cards = [
    { label: 'Leads', value: stats.leads, color: 'text-blue-600' },
    { label: 'Bookings', value: stats.bookings, color: 'text-emerald-600' },
    { label: 'Profesionales', value: stats.professionals, color: 'text-purple-600' },
  ];
  return (
    <div>
      <h1 className='text-xl font-medium text-gray-900 mb-6'>Resumen</h1>
      <div className='grid grid-cols-3 gap-4 mb-8'>
        {cards.map(card => (
          <div key={card.label} className='bg-white rounded-xl border border-gray-200 p-5'>
            <p className='text-sm text-gray-500 mb-1'>{card.label}</p>
            <p className={'text-3xl font-medium ' + card.color}>{loading ? '-' : card.value}</p>
          </div>
        ))}
      </div>
      <div className='bg-white rounded-xl border border-gray-200 p-5'>
        <p className='text-sm font-medium text-gray-700 mb-3'>Estado del sistema</p>
        {[{label:'API Backend',status:'Activo',ok:true},{label:'Base de datos',status:'Conectado',ok:true},{label:'Stripe',status:'Sandbox',ok:false}].map(item => (
          <div key={item.label} className='flex items-center justify-between py-2'>
            <span className='text-sm text-gray-600'>{item.label}</span>
            <span className={'text-xs px-2 py-0.5 rounded-full ' + (item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}