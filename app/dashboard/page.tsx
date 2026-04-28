'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today'|'week'|'month'>('today');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [bR, pR, lR] = await Promise.all([
        fetch(API+'/bookings?limit=100', { headers: { Authorization: 'Bearer '+token } }),
        fetch(API+'/professionals', { headers: { Authorization: 'Bearer '+token } }),
        fetch(API+'/leads?limit=100', { headers: { Authorization: 'Bearer '+token } }),
      ]);
      const [bookings, pros, leads] = await Promise.all([bR.json(), pR.json(), lR.json()]);
      const allB = bookings.data||[]; const allP = pros.data||[]; const allL = leads.data||[];
      const now = new Date();
      const starts: Record<string,Date> = { today: new Date(now.getFullYear(),now.getMonth(),now.getDate()), week: new Date(now.getTime()-7*864e5), month: new Date(now.getFullYear(),now.getMonth(),1) };
      const pB = allB.filter((b:any) => new Date(b.created_at||b.scheduled_at) >= starts[period]);
      const completed = pB.filter((b:any) => b.status==='COMPLETED');
      setData({
        periodBookings: pB.length, completed: completed.length,
        inProgress: allB.filter((b:any)=>b.status==='IN_PROGRESS').length,
        pending: allB.filter((b:any)=>b.status==='PENDING_ASSIGNMENT').length,
        revenue: completed.reduce((s:number,b:any)=>s+Number(b.total_amount||0),0).toFixed(0),
        totalPros: allP.length, availablePros: allP.filter((p:any)=>p.is_available).length,
        totalLeads: allL.length, recentBookings: allB.slice(0,6), recentLeads: allL.slice(0,5),
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const STATUS_COLOR: Record<string,string> = { PENDING_ASSIGNMENT:'bg-amber-100 text-amber-700', CONFIRMED:'bg-blue-100 text-blue-700', IN_PROGRESS:'bg-purple-100 text-purple-700', COMPLETED:'bg-emerald-100 text-emerald-700', CANCELLED:'bg-red-100 text-red-700' };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">{t('admin.dashboard.title')}</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['today','week','month'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-xs font-medium ${period===p?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>
              {t('admin.dashboard.'+p)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('admin.dashboard.revenue')}</p><p className="text-xl font-bold text-emerald-600">${loading?'...':data?.revenue||0}</p></div>
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('sidebar.bookings')}</p><p className="text-xl font-bold text-blue-600">{loading?'...':data?.periodBookings}</p></div>
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('statuses.COMPLETED')}</p><p className="text-xl font-bold text-emerald-600">{loading?'...':data?.completed}</p></div>
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('statuses.IN_PROGRESS')}</p><p className="text-xl font-bold text-purple-600">{loading?'...':data?.inProgress}</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('statuses.PENDING_ASSIGNMENT')}</p><p className="text-xl font-bold text-amber-600">{loading?'...':data?.pending}</p></div>
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('sidebar.professionals')}</p><p className="text-xl font-bold text-blue-600">{loading?'...':data?.totalPros}</p></div>
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('sidebar.leads')}</p><p className="text-xl font-bold text-purple-600">{loading?'...':data?.totalLeads}</p></div>
        <div className="bg-white rounded-xl border p-3"><p className="text-xs text-gray-500">{t('admin.dashboard.systemStatus')}</p><div className="flex gap-1 mt-1">{['API','DB','SMS'].map(s=>(<span key={s} className="text-[10px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">{s} ✓</span>))}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex justify-between mb-3"><h2 className="font-semibold text-gray-900 text-sm">{t('admin.dashboard.recentBookings')}</h2><button onClick={load} className="text-xs text-emerald-600">{t('common.refresh')}</button></div>
          <div className="space-y-2">
            {(data?.recentBookings||[]).map((b:any) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1"><p className="text-xs font-medium text-gray-900 truncate">{b.service_type?.replace(/_/g,' ')}</p><p className="text-[10px] text-gray-400 truncate">{b.address}, {b.city}</p></div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 whitespace-nowrap ${STATUS_COLOR[b.status]||''}`}>{t('statuses.'+b.status)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">{t('admin.dashboard.commercialLeads')}</h2>
          <div className="space-y-2">
            {(data?.recentLeads||[]).map((l:any) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1"><p className="text-xs font-medium text-gray-900 truncate">{l.company_name||l.contact_name}</p><p className="text-[10px] text-gray-400">{l.city}, {l.state}</p></div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-2">{l.status}</span>
              </div>
            ))}
            {!data?.recentLeads?.length && <p className="text-center text-gray-400 text-xs py-6">{t('admin.dashboard.noLeads')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
