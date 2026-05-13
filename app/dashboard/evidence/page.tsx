'use client';
import { useEffect, useState } from 'react';
import { getApiBase } from '../../../lib/apiBase';
import { useTranslation } from '../../../lib/i18n/useTranslation';

function MarkBadge({ mark, color }: { mark: string; color: string }) { return <span style={{width:34,height:34,borderRadius:10,background:color+'14',border:'1px solid '+color+'33',color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{mark}</span>; }

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC', shadow:'0 2px 8px rgba(13,55,129,0.06)', danger:'#DC2626', warning:'#F59E0B' };
const CAT_STYLE: Record<string,{bg:string,color:string,mark:string}> = {
  DAMAGE:{bg:'#FEE2E2',color:'#991B1B',mark:'DM'}, INVENTORY:{bg:'#FEF3C7',color:'#92400E',mark:'IN'},
  BEFORE:{bg:'#DBEAFE',color:'#1E40AF',mark:'BE'}, AFTER:{bg:'#D1FAE5',color:'#065F46',mark:'AF'},
  FINAL_RESULT:{bg:'#EDE9FE',color:'#5B21B6',mark:'FR'}, STOCK_LOW:{bg:'#FEE2E2',color:'#991B1B',mark:'SL'},
};

export default function EvidencePage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(getApiBase() + '/admin/evidence', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => { setItems(d.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? items : items.filter(i => i.category === filter);
  const damages = items.filter(i => i.category === 'DAMAGE');
  const card = (p = '20px') => ({ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, padding: p });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('admin.evidence.kicker')}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: C.ink }}>{t('admin.evidence.title')}</h1>
          <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>{t('admin.evidence.subtitle')}</p>
        </div>
        {damages.length > 0 && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FECACA', color: C.danger, fontSize: 13, fontWeight: 600 }}>
            {damages.length} {t('admin.evidence.damagePending')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['ALL','DAMAGE','INVENTORY','BEFORE','AFTER','FINAL_RESULT','STOCK_LOW'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ padding: '6px 14px', borderRadius: 9999, border: `1px solid ${filter===cat ? C.navy : C.border}`, background: filter===cat ? C.navy : '#fff', color: filter===cat ? '#fff' : C.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {CAT_STYLE[cat]?.mark || 'AL'} {cat.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : filtered.length === 0
        ? <div style={{ ...card('60px'), textAlign: 'center', color: C.muted }}>{t('admin.evidence.noItems')}{filter !== 'ALL' ? ` for ${filter}` : ''}.</div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {filtered.map((item: any) => {
              const cat = CAT_STYLE[item.category] || { bg: '#F1F5F9', color: C.muted, mark: 'EV' };
              return (
                <div key={item.id} style={card('0px')}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.category} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '14px 14px 0 0' }} />
                    : <div style={{ width: '100%', height: 180, borderRadius: '14px 14px 0 0', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>{cat.mark}</div>}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ ...cat, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{cat.mark} {item.category}</span>
                      {item.severity && <span style={{ fontSize: 11, color: item.severity === 'HIGH' ? C.danger : item.severity === 'MEDIUM' ? C.warning : C.muted }}>{item.severity}</span>}
                    </div>
                    {item.notes && <p style={{ margin: '0 0 8px', fontSize: 12, color: C.ink }}>{item.notes}</p>}
                    <div style={{ fontSize: 11, color: C.muted }}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                    {item.aircover_ready && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: C.green }}>{t('admin.evidence.aircoverReady')}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
