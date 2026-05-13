'use client';
import { useEffect, useState } from 'react';
import { getApiBase } from '../../../lib/apiBase';
import { useTranslation } from '../../../lib/i18n/useTranslation';

function MarkBadge({ mark, color }: { mark: string; color: string }) { return <span style={{width:34,height:34,borderRadius:10,background:color+'14',border:'1px solid '+color+'33',color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{mark}</span>; }

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC', shadow:'0 2px 8px rgba(13,55,129,0.06)', danger:'#DC2626', warning:'#F59E0B' };
const SEV: Record<string,{bg:string,color:string,mark:string}> = {
  HIGH:{bg:'#FEE2E2',color:'#991B1B',mark:'HI'},
  MEDIUM:{bg:'#FEF3C7',color:'#92400E',mark:'MD'},
  LOW:{bg:'#D1FAE5',color:'#065F46',mark:'LO'},
};
const EVT_ICON: Record<string,string> = { DAMAGE_REPORTED:'DM', STOCK_LOW:'SL', LEAD_CREATED:'LD', AIRBNB_TURNOVER_NEEDED:'AB', PAYMENT_FAILED:'PY', LOW_MARGIN_BOOKING:'LM' };

export default function AlertsPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem('token') || '';
    fetch(getApiBase() + '/admin/alerts', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => { setAlerts(d.data || []); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function acknowledge(id: string) {
    const token = localStorage.getItem('token') || '';
    await fetch(getApiBase() + '/admin/alerts/' + id + '/acknowledge', { method: 'PATCH', headers: { Authorization: 'Bearer ' + token } });
    await load();
  }

  const newAlerts = alerts.filter(a => a.status === 'NEW');
  const card = (p = '20px') => ({ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, padding: p });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('admin.alerts.kicker')}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: C.ink }}>{t('admin.alerts.title')}</h1>
          <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>{t('admin.alerts.subtitle')}</p>
        </div>
        {newAlerts.length > 0 && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#FEE2E2', color: C.danger, fontSize: 13, fontWeight: 700 }}>
            {newAlerts.length} {t('admin.alerts.newAlerts')}
          </div>
        )}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : alerts.length === 0
        ? (
          <div style={{ ...card('60px'), textAlign: 'center' }}>
            <div style={{ marginBottom: 16, display:'flex', justifyContent:'center' }}><MarkBadge mark="OK" color={C.green}/></div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{t('admin.alerts.noActive')}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{t('admin.alerts.noActiveText')}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map((alert: any) => {
              const sev = SEV[alert.severity] || SEV.LOW;
              return (
                <div key={alert.id} style={{ ...card('20px'), display: 'flex', alignItems: 'center', gap: 16, opacity: alert.status === 'ACKNOWLEDGED' ? 0.6 : 1 }}>
                  <MarkBadge mark={EVT_ICON[alert.event_type] || 'EV'} color={sev.color}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{(alert.event_type||'').replace(/_/g,' ')}</span>
                      <span style={{ ...sev, borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{sev.mark} {alert.severity}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>via {alert.source || 'system'}</span>
                    </div>
                    {alert.payload?.message && <div style={{ fontSize: 12, color: C.muted }}>{alert.payload.message}</div>}
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{alert.created_at ? new Date(alert.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {alert.status === 'NEW' && (
                      <button onClick={() => acknowledge(alert.id)} style={{ padding: '6px 14px', borderRadius: 9999, border: 0, background: C.green, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t('admin.alerts.acknowledge')}</button>
                    )}
                    <span style={{ borderRadius: 9999, padding: '6px 12px', fontSize: 11, fontWeight: 600, background: alert.status === 'NEW' ? '#FEF3C7' : '#F1F5F9', color: alert.status === 'NEW' ? '#92400E' : C.muted }}>{alert.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
