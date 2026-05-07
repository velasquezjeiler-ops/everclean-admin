'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = '/api';

export default function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API+'/leads?limit=100', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => { setLeads(d.data||[]); setLoading(false); });
  }, []);

  const converted = leads.filter((lead) => lead.status === 'CONVERTED').length;
  const open = leads.length - converted;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#0D3781] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="ec-page">
      <div className="ec-page-header">
        <div>
          <p className="ec-eyebrow">{t('sidebar.leads')}</p>
          <h1 className="ec-title">{t('admin.leads.title')}</h1>
          <p className="ec-subtitle">{t('admin.leads.subtitle')}</p>
        </div>
        <div className="ec-pill bg-[#EAF4FF] text-[#0D3781]">{leads.length} {t('admin.leads.records')}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[
          { label: t('admin.leads.totalLeads'), value: leads.length, color: '#0D3781' },
          { label: t('admin.leads.open'), value: open, color: '#F59E0B' },
          { label: t('admin.leads.converted'), value: converted, color: '#4CAF50' },
        ].map((item) => (
          <section key={item.label} className="ec-panel p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{item.label}</div>
            <div className="mt-2 text-3xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
          </section>
        ))}
      </div>
      {leads.length === 0 ? (
        <div className="text-center py-12 ec-card"><p className="text-[#64748B] text-sm">{t('admin.dashboard.noLeads')}</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {leads.map(l => (
            <div key={l.id} className="ec-card p-5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-extrabold text-[#0D1B2A] text-sm truncate flex-1">{l.company_name || l.contact_name}</p>
                <span className={`ec-pill ${l.status==='CONVERTED'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{l.status || t('admin.leads.new')}</span>
              </div>
              <p className="text-xs text-gray-500">{l.contact_email} · {l.contact_phone||'—'}</p>
              {l.city && <p className="text-xs text-gray-400 mt-0.5">📍 {l.city}, {l.state}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{l.source_channel||'—'}</span>
                {l.created_at && <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{new Date(l.created_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
