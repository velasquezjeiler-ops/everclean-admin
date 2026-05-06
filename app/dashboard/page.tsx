'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', bg:'#F5F7FA', text:'#0D1B2A', muted:'#64748B', border:'#E2E8F0' };

type Period = 'today' | 'week' | 'month';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function serviceLabel(value?: string) {
  return (value || 'SERVICE').replace(/_/g, ' ');
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('today');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    setLoading(true);
    try {
      const [bR, pR, lR] = await Promise.all([
        fetch(API + '/bookings?limit=100', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/professionals', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/leads?limit=100', { headers: { Authorization: 'Bearer ' + token } }),
      ]);
      const [bookings, pros, leads] = await Promise.all([bR.json(), pR.json(), lR.json()]);
      const allB = bookings.data || [];
      const allP = pros.data || [];
      const allL = leads.data || [];
      const now = new Date();
      const starts: Record<Period, Date> = {
        today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        week: new Date(now.getTime() - 7 * 864e5),
        month: new Date(now.getFullYear(), now.getMonth(), 1),
      };
      const pB = allB.filter((b: any) => new Date(b.created_at || b.scheduled_at) >= starts[period]);
      const completed = pB.filter((b: any) => b.status === 'COMPLETED');
      setData({
        periodBookings: pB.length,
        completed: completed.length,
        inProgress: allB.filter((b: any) => b.status === 'IN_PROGRESS').length,
        pending: allB.filter((b: any) => b.status === 'PENDING_ASSIGNMENT').length,
        revenue: completed.reduce((s: number, b: any) => s + Number(b.client_price || b.total_amount || 0), 0).toFixed(0),
        totalPros: allP.length,
        availablePros: allP.filter((p: any) => p.is_available).length,
        totalLeads: allL.length,
        recentBookings: allB.slice(0, 6),
        recentLeads: allL.slice(0, 5),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const periodLabels: Record<Period, string> = {
    today: t('admin.dashboard.today'),
    week: t('admin.dashboard.thisWeek'),
    month: t('admin.dashboard.thisMonth'),
  };

  const statusClass: Record<string, string> = {
    PENDING_ASSIGNMENT: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const stats = [
    { label: t('admin.dashboard.revenue'), value: `$${loading ? '...' : data?.revenue || 0}`, sub: 'Selected period', bg: 'linear-gradient(135deg, #4CAF50, #388E3C)' },
    { label: t('sidebar.bookings'), value: loading ? '...' : data?.periodBookings || 0, sub: periodLabels[period], bg: 'linear-gradient(135deg, #1565C0, #0D3781)' },
    { label: t('statuses.COMPLETED'), value: loading ? '...' : data?.completed || 0, sub: 'Finished services', bg: 'linear-gradient(135deg, #7C3AED, #5B21B6)' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto font-sans">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-normal text-[#0D1B2A]">{greeting()}, Admin</h1>
          <p className="text-sm text-[#64748B] mt-1">Monitor bookings, professionals, leads, and live operations.</p>
        </div>
        <div className="inline-flex w-fit gap-1 rounded-xl bg-[#EAF0F7] p-1">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-xs font-extrabold ${period === p ? 'bg-white text-[#0D3781] shadow-sm' : 'text-[#64748B]'}`}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {stats.map((s) => (
          <section key={s.label} className="relative overflow-hidden rounded-2xl p-6 text-white shadow-[0_14px_28px_rgba(13,55,129,0.12)]" style={{ background: s.bg }}>
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="text-sm font-bold opacity-90">{s.label}</div>
            <div className="mt-2 text-4xl font-extrabold">{s.value}</div>
            <div className="mt-1 text-xs font-bold opacity-80">{s.sub}</div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: t('statuses.IN_PROGRESS'), value: data?.inProgress || 0, color: C.blue },
          { label: t('statuses.PENDING_ASSIGNMENT'), value: data?.pending || 0, color: '#F59E0B' },
          { label: t('sidebar.professionals'), value: data?.totalPros || 0, color: C.green },
          { label: t('sidebar.leads'), value: data?.totalLeads || 0, color: '#7C3AED' },
        ].map((s) => (
          <section key={s.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{s.label}</div>
            <div className="mt-2 text-3xl font-extrabold" style={{ color: s.color }}>{loading ? '...' : s.value}</div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-5">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-[#0D1B2A]">{t('admin.dashboard.recentBookings')}</h2>
            <Link href="/dashboard/bookings" className="text-xs font-extrabold text-[#1565C0]">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentBookings || []).map((b: any) => (
              <div key={b.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[#0D1B2A] truncate">{serviceLabel(b.service_type)}</div>
                    <div className="mt-1 text-xs text-[#64748B] truncate">{b.address}, {b.city}</div>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-extrabold ${statusClass[b.status] || 'bg-slate-100 text-slate-600'}`}>{t('statuses.' + b.status)}</span>
                </div>
              </div>
            ))}
            {!loading && !(data?.recentBookings || []).length && <div className="py-12 text-center text-sm text-[#64748B]">No bookings yet</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-[#0D1B2A]">{t('admin.dashboard.commercialLeads')}</h2>
            <Link href="/dashboard/leads" className="text-xs font-extrabold text-[#1565C0]">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentLeads || []).map((l: any) => (
              <div key={l.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <div className="text-sm font-extrabold text-[#0D1B2A] truncate">{l.company_name || l.contact_name || 'Lead'}</div>
                <div className="mt-1 text-xs text-[#64748B]">{l.city || 'City'}, {l.state || 'State'}</div>
                <div className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">{l.status || 'NEW'}</div>
              </div>
            ))}
            {!loading && !(data?.recentLeads || []).length && <p className="text-center text-[#64748B] text-sm py-12">{t('admin.dashboard.noLeads')}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}