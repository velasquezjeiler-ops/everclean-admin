'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const STATUS_COLOR: Record<string,string> = { PENDING_ASSIGNMENT:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700', IN_PROGRESS:'bg-purple-100 text-purple-700', COMPLETED:'bg-emerald-100 text-emerald-700', CANCELLED:'bg-red-100 text-red-700' };

export default function BookingsPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API+'/bookings?limit=100', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => { setBookings(d.data||[]); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('admin.bookings.title')} ({bookings.length})</h1>

      {/* Mobile: cards. Desktop: table */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500"><tr>
            <th className="text-left p-3">{t('admin.bookings.service')}</th>
            <th className="text-left p-3">{t('admin.bookings.company')}</th>
            <th className="text-left p-3">{t('admin.bookings.date')}</th>
            <th className="text-right p-3">{t('admin.bookings.total')}</th>
            <th className="text-left p-3">{t('admin.bookings.professional')}</th>
            <th className="text-left p-3">{t('admin.bookings.status')}</th>
          </tr></thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="p-3"><p className="font-medium">{(b.service_type||'').replace(/_/g,' ')}</p><p className="text-[10px] text-gray-400">{b.frequency||'ONE_TIME'}</p></td>
                <td className="p-3 text-gray-600">{b.companyName||'—'}</td>
                <td className="p-3 text-gray-600">{b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString() : '—'}</td>
                <td className="p-3 text-right font-medium">${b.total_amount||0}</td>
                <td className="p-3 text-gray-600">{b.professionals?.[0]?.professional?.fullName || t('admin.bookings.unassigned')}</td>
                <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status]||''}`}>{t('statuses.'+b.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {bookings.map(b => (
          <div key={b.id} className="bg-white rounded-xl border p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-gray-900 text-sm truncate flex-1">{(b.service_type||'').replace(/_/g,' ')}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[b.status]||''}`}>{t('statuses.'+b.status)}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{b.companyName||'—'} · {b.scheduled_at?new Date(b.scheduled_at).toLocaleDateString():'—'}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">{b.professionals?.[0]?.professional?.fullName || t('admin.bookings.unassigned')}</span>
              <span className="text-sm font-semibold text-emerald-700">${b.total_amount||0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
