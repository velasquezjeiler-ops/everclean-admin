'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';

export default function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API+'/leads?limit=100', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => { setLeads(d.data||[]); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('admin.leads.title')} ({leads.length})</h1>
      {leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border"><p className="text-gray-400 text-sm">{t('admin.dashboard.noLeads')}</p></div>
      ) : (
        <div className="space-y-3">
          {leads.map(l => (
            <div key={l.id} className="bg-white rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-gray-900 text-sm truncate flex-1">{l.company_name || l.contact_name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${l.status==='CONVERTED'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{l.status}</span>
              </div>
              <p className="text-xs text-gray-500">{l.contact_email} · {l.contact_phone||'—'}</p>
              {l.city && <p className="text-xs text-gray-400 mt-0.5">📍 {l.city}, {l.state}</p>}
              <div className="flex flex-wrap gap-1 mt-2">
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
