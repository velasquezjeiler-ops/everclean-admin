'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';

export default function ProfessionalsPage() {
  const { t } = useTranslation();
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(API+'/professionals', { headers: { Authorization: 'Bearer '+token } })
      .then(r => r.json()).then(d => { setPros(d.data||[]); setLoading(false); });
  }, []);

  const available = pros.filter((p) => p.is_available).length;
  const avgRate = pros.length ? pros.reduce((sum, p) => sum + Number(p.hourly_rate || 0), 0) / pros.length : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#0D3781] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="ec-page">
      <div className="ec-page-header">
        <div>
          <p className="ec-eyebrow">{t('sidebar.professionals')}</p>
          <h1 className="ec-title">{t('admin.professionals.title')}</h1>
          <p className="ec-subtitle">{t('admin.professionals.subtitle')}</p>
        </div>
        <div className="ec-pill bg-[#EAF4FF] text-[#0D3781]">{pros.length} {t('admin.professionals.records')}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[
          { label: t('admin.professionals.title'), value: pros.length, color: '#0D3781' },
          { label: t('admin.professionals.available'), value: available, color: '#4CAF50' },
          { label: t('admin.professionals.avgRate'), value: `$${avgRate.toFixed(0)}`, color: '#1565C0' },
        ].map((item) => (
          <section key={item.label} className="ec-panel p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{item.label}</div>
            <div className="mt-2 text-3xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {pros.map(p => (
          <div key={p.id} className="ec-card p-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelected(selected?.id===p.id ? null : p)}>
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 ${p.is_available?'bg-[#4CAF50]':'bg-[#94A3B8]'}`}>
                {(p.full_name||'P')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-[#0D1B2A] text-sm">{p.full_name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={`ec-pill ${p.is_available?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>
                    {p.is_available ? t('admin.professionals.available') : t('admin.professionals.unavailable')}
                  </span>
                  <span className="ec-pill bg-blue-50 text-blue-700">${p.hourly_rate||25}/hr</span>
                  {p.avg_rating && <span className="ec-pill bg-amber-50 text-amber-700">{Number(p.avg_rating).toFixed(1)}</span>}
                </div>
              </div>
              <span className="text-[#64748B] text-sm">{selected?.id===p.id ? 'Less' : 'More'}</span>
            </div>

            {selected?.id === p.id && (
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[#64748B]">{t('common.phone')}:</span> <span className="font-bold">{p.phone || '-'}</span></div>
                  <div><span className="text-[#64748B]">{t('common.email')}:</span> <span className="font-bold truncate">{p.email || '-'}</span></div>
                  <div><span className="text-[#64748B]">{t('common.city')}:</span> <span className="font-bold">{p.city || '-'}, {p.state || 'NJ'}</span></div>
                  <div><span className="text-gray-500">{t('admin.professionals.services')}:</span> <span className="font-medium">{p.total_services || 0}</span></div>
                </div>
                {p.services_offered && (
                  <div className="flex flex-wrap gap-1">
                    {(typeof p.services_offered === 'string' ? JSON.parse(p.services_offered) : p.services_offered || []).map((s:string) => (
                      <span key={s} className="ec-pill bg-[#F8FAFC] text-[#64748B]">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {p.lat && p.lng && (
                    <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2 bg-[#0D3781] text-white rounded-lg text-xs font-bold text-center">
                      {t('map.openGoogleMaps')}
                    </a>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex-1 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-xs font-bold text-center">
                      {t('client.dashboard.callCleaner')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
