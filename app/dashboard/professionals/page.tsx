'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('admin.professionals.title')} ({pros.length})</h1>

      <div className="space-y-3">
        {pros.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-3 md:p-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelected(selected?.id===p.id ? null : p)}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${p.is_available?'bg-emerald-600':'bg-gray-400'}`}>
                {(p.full_name||'P')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{p.full_name}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.is_available?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>
                    {p.is_available ? t('admin.professionals.available') : t('admin.professionals.unavailable')}
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-1.5 py-0.5">${p.hourly_rate||25}/hr</span>
                  {p.avg_rating && <span className="text-[10px] bg-amber-50 text-amber-700 rounded-full px-1.5 py-0.5">⭐ {Number(p.avg_rating).toFixed(1)}</span>}
                </div>
              </div>
              <span className="text-gray-400 text-sm">{selected?.id===p.id ? '▲' : '▼'}</span>
            </div>

            {selected?.id === p.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">{t('common.phone')}:</span> <span className="font-medium">{p.phone || '—'}</span></div>
                  <div><span className="text-gray-500">{t('common.email')}:</span> <span className="font-medium truncate">{p.email || '—'}</span></div>
                  <div><span className="text-gray-500">{t('common.city')}:</span> <span className="font-medium">{p.city || '—'}, {p.state || 'NJ'}</span></div>
                  <div><span className="text-gray-500">{t('admin.professionals.services')}:</span> <span className="font-medium">{p.total_services || 0}</span></div>
                </div>
                {p.services_offered && (
                  <div className="flex flex-wrap gap-1">
                    {(typeof p.services_offered === 'string' ? JSON.parse(p.services_offered) : p.services_offered || []).map((s:string) => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {p.lat && p.lng && (
                    <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium text-center">
                      📍 {t('map.openGoogleMaps')}
                    </a>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs text-center">
                      📞 {t('client.dashboard.callCleaner')}
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
