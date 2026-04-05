'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
const SC = { PENDING_ASSIGNMENT: 'bg-amber-50 text-amber-700', CONFIRMED: 'bg-blue-50 text-blue-700', IN_PROGRESS: 'bg-purple-50 text-purple-700', COMPLETED: 'bg-emerald-50 text-emerald-700', CANCELLED: 'bg-red-50 text-red-700' };
export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    api.bookings.list(token).then(data => { setBookings(data.data || []); setTotal(data.total || 0); setLoading(false); });
  }, []);
  return (
    <div>
      <h1 className='text-xl font-medium text-gray-900 mb-6'>Bookings ({total})</h1>
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <table className='w-full text-sm'>
          <thead><tr className='border-b border-gray-100'>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Servicio</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Empresa</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Fecha</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Total</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Estado</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className='px-4 py-8 text-center text-gray-400'>Cargando...</td></tr>
            : bookings.length === 0 ? <tr><td colSpan={5} className='px-4 py-8 text-center text-gray-400'>Sin bookings</td></tr>
            : bookings.map((b) => (
              <tr key={b.id} className='border-b border-gray-50 hover:bg-gray-50'>
                <td className='px-4 py-3'><p className='font-medium text-gray-900'>{b.serviceType}</p><p className='text-gray-400 text-xs'>{b.frequency}</p></td>
                <td className='px-4 py-3 text-gray-600'>{b.company?.name || '-'}</td>
                <td className='px-4 py-3 text-gray-600'>{new Date(b.scheduledAt).toLocaleDateString()}</td>
                <td className='px-4 py-3 font-medium text-gray-900'>{b.totalAmount || '-'}</td>
                <td className='px-4 py-3'><span className={'text-xs px-2 py-0.5 rounded-full ' + (SC[b.status] || 'bg-gray-50 text-gray-600')}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}