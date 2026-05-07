'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = '/api';
const STATUS_COLOR: Record<string,string> = { PENDING_ASSIGNMENT:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700', IN_PROGRESS:'bg-purple-100 text-purple-700', COMPLETED:'bg-emerald-100 text-emerald-700', CANCELLED:'bg-red-100 text-red-700' };

function serviceLabel(value?: string) {
  return (value || 'SERVICE').replace(/_/g, ' ');
}

export default function BookingsPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API+'/bookings?limit=100', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => { setBookings(d.data||[]); setLoading(false); });
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount || b.client_price || 0), 0);
  const pending = bookings.filter((b) => b.status === 'PENDING_ASSIGNMENT').length;
  const active = bookings.filter((b) => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#0D3781] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="ec-page">
      <div className="ec-page-header">
        <div>
          <p className="ec-eyebrow">{t('sidebar.bookings')}</p>
          <h1 className="ec-title">{t('admin.bookings.title')}</h1>
          <p className="ec-subtitle">{t('admin.bookings.subtitle')}</p>
        </div>
        <div className="ec-pill bg-[#EAF4FF] text-[#0D3781]">{bookings.length} {t('admin.bookings.records')}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[
          { label: t('admin.bookings.totalBookings'), value: bookings.length, color: '#0D3781' },
          { label: t('statuses.PENDING_ASSIGNMENT'), value: pending, color: '#F59E0B' },
          { label: t('admin.bookings.activeWork'), value: active, color: '#4CAF50' },
        ].map((item) => (
          <section key={item.label} className="ec-panel p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{item.label}</div>
            <div className="mt-2 text-3xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
          </section>
        ))}
      </div>

      {/* Mobile: cards. Desktop: table */}
      <div className="hidden md:block ec-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] text-xs text-[#64748B] uppercase tracking-wide"><tr>
            <th className="text-left px-5 py-4">{t('admin.bookings.service')}</th>
            <th className="text-left px-5 py-4">{t('admin.bookings.company')}</th>
            <th className="text-left px-5 py-4">{t('admin.bookings.date')}</th>
            <th className="text-right px-5 py-4">{t('admin.bookings.total')}</th>
            <th className="text-left px-5 py-4">{t('admin.bookings.professional')}</th>
            <th className="text-left px-5 py-4">{t('admin.bookings.status')}</th>
          </tr></thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-t border-[#EDF2F7] hover:bg-[#F8FAFC]">
                <td className="px-5 py-4"><p className="font-extrabold text-[#0D1B2A]">{serviceLabel(b.service_type)}</p><p className="text-[11px] text-[#94A3B8]">{b.frequency||'ONE_TIME'}</p></td>
                <td className="px-5 py-4 text-[#64748B]">{b.companyName || '-'}</td>
                <td className="px-5 py-4 text-[#64748B]">{b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString() : '-'}</td>
                <td className="p-3 text-right font-extrabold text-[#0D3781]">${b.total_amount||0}</td>
                <td className="p-3 text-gray-600">{b.professionals?.[0]?.professional?.fullName || t('admin.bookings.unassigned')}</td>
                <td className="p-3"><span className={`ec-pill ${STATUS_COLOR[b.status]||''}`}>{t('statuses.'+b.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {bookings.map(b => (
          <div key={b.id} className="ec-panel p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-extrabold text-[#0D1B2A] text-sm truncate flex-1">{serviceLabel(b.service_type)}</p>
              <span className={`ec-pill ${STATUS_COLOR[b.status]||''}`}>{t('statuses.'+b.status)}</span>
            </div>
            <p className="text-xs text-[#64748B] truncate">{b.companyName || '-'} | {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString() : '-'}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">{b.professionals?.[0]?.professional?.fullName || t('admin.bookings.unassigned')}</span>
              <span className="text-sm font-extrabold text-[#0D3781]">${b.total_amount||0}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right text-xs font-bold text-[#64748B]">{t('admin.bookings.totalRevenue')}: ${totalRevenue.toFixed(0)}</div>
    </div>
  );
}
