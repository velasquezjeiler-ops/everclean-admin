'use client';
import { useEffect, useState, useCallback } from 'react';
import { getLocale, t } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

function StatCard({ label, value, sub, color, icon }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<'en' | 'es'>('es');
  const [period, setPeriod] = useState<'today'|'week'|'month'>('today');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [bookingsRes, prosRes, leadsRes] = await Promise.all([
        fetch(API + '/bookings?limit=100', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/professionals', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/leads?limit=100', { headers: { Authorization: 'Bearer ' + token } }),
      ]);
      const [bookings, pros, leads] = await Promise.all([
        bookingsRes.json(), prosRes.json(), leadsRes.json()
      ]);

      const allBookings = bookings.data || bookings || [];
      const allPros = pros.data || pros || [];
      const allLeads = leads.data || leads || [];

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const periodStart = period === 'today' ? todayStart : period === 'week' ? weekStart : monthStart;

      const periodBookings = allBookings.filter((b: any) => new Date(b.createdAt || b.scheduledAt) >= periodStart);
      const completed = periodBookings.filter((b: any) => b.status === 'COMPLETED');
      const inProgress = allBookings.filter((b: any) => b.status === 'IN_PROGRESS');
      const pending = allBookings.filter((b: any) => b.status === 'PENDING_ASSIGNMENT');
      const revenue = completed.reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0);
      const availablePros = allPros.filter((p: any) => p.isAvailable || p.is_available);

      setData({
        periodBookings: periodBookings.length,
        completed: completed.length,
        inProgress: inProgress.length,
        pending: pending.length,
        revenue: revenue.toFixed(0),
        totalPros: allPros.length,
        availablePros: availablePros.length,
        totalLeads: allLeads.length,
        recentBookings: allBookings.slice(0, 8),
        recentLeads: allLeads.slice(0, 5),
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    setLocale(getLocale());
    load();
  }, [load]);

  const STATUS_COLOR: Record<string, string> = {
    PENDING_ASSIGNMENT: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['today','week','month'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {p === 'today' ? t(locale, 'today') : p === 'week' ? t(locale, 'thisWeek') : t(locale, 'thisMonth')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t(locale, 'revenue')} value={loading ? '...' : '$' + (data?.revenue || 0)} sub={t(locale, 'completedServices')} color="text-emerald-600" icon="💰" />
        <StatCard label="Bookings" value={loading ? '...' : data?.periodBookings} sub={period + ' total'} color="text-blue-600" icon="📋" />
        <StatCard label={t(locale, 'completed')} value={loading ? '...' : data?.completed} sub={t(locale, 'servicesDone')} color="text-emerald-600" icon="✅" />
        <StatCard label="In Progress" value={loading ? '...' : data?.inProgress} sub="Active right now" color="text-purple-600" icon="🧹" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending" value={loading ? '...' : data?.pending} sub="Need assignment" color="text-amber-600" icon="⏳" />
        <StatCard label="Professionals" value={loading ? '...' : data?.totalPros} sub={`${data?.availablePros || 0} available`} color="text-blue-600" icon="👷" />
        <StatCard label="Leads" value={loading ? '...' : data?.totalLeads} sub="Commercial pipeline" color="text-purple-600" icon="🎯" />
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-3">System status</p>
          {[
            { label: 'API', ok: true },
            { label: 'Database', ok: true },
            { label: 'Emails', ok: true },
            { label: 'SMS', ok: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-600">{s.label}</span>
              <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
            <button onClick={load} className="text-xs text-emerald-700 font-medium">Refresh</button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-3">
              {(data?.recentBookings || []).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.serviceType?.replace(/_/g,' ')}</p>
                    <p className="text-xs text-gray-400">{b.address}, {b.city}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {b.status?.replace(/_/g,' ')}
                    </span>
                    {b.totalAmount && <p className="text-xs text-emerald-700 font-medium mt-0.5">${b.totalAmount}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Commercial Leads</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-3">
              {(data?.recentLeads || []).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.businessName || l.business_name}</p>
                    <p className="text-xs text-gray-400">{l.city}, {l.state}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {l.status}
                  </span>
                </div>
              ))}
              {(!data?.recentLeads?.length) && (
                <p className="text-center text-gray-400 text-sm py-8">No leads yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
