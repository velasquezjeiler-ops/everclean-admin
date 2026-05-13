'use client';
import { useEffect, useState } from 'react';
import { getApiBase } from '../../../lib/apiBase';
import { useTranslation } from '../../../lib/i18n/useTranslation';

function MarkBadge({ mark, color }: { mark: string; color: string }) { return <span style={{width:34,height:34,borderRadius:10,background:color+'14',border:'1px solid '+color+'33',color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{mark}</span>; }

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC', shadow:'0 2px 8px rgba(13,55,129,0.06)', warning:'#F59E0B', danger:'#DC2626' };

const PLATFORM_COLORS: Record<string,{bg:string,color:string}> = {
  AIRBNB:{bg:'#FFE4D6',color:'#FF5A5F'}, VRBO:{bg:'#DBEAFE',color:'#1E40AF'},
  BOOKING:{bg:'#EDE9FE',color:'#5B21B6'}, MANUAL:{bg:'#F1F5F9',color:'#64748B'},
};

export default function AirbnbAdminPage() {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string|null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', address:'', city:'', state:'', zip_code:'', bedrooms:'', bathrooms:'', sqft:'', ical_url:'', platform:'AIRBNB' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const token = localStorage.getItem('token') || '';
    const h = { Authorization: 'Bearer ' + token };
    const [propsRes, bkgsRes] = await Promise.all([
      fetch(getApiBase() + '/admin/properties', { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(getApiBase() + '/bookings?limit=50', { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
    ]);
    setProperties(propsRes.data || []);
    // Only show airbnb-style bookings (quick turnovers)
    setBookings((bkgsRes.data || []).filter((b: any) => b.property_id || b.service_type === 'QUICK_TURNOVER'));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addProperty() {
    setSaving(true);
    const token = localStorage.getItem('token') || '';
    const r = await fetch(getApiBase() + '/admin/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ ...form, bedrooms: Number(form.bedrooms)||null, bathrooms: Number(form.bathrooms)||null, sqft: Number(form.sqft)||null }),
    }).then(d => d.json()).catch(() => ({ error: 'Failed' }));
    if (r.success) { setMsg('Property added'); setShowAdd(false); setForm({ name:'', address:'', city:'', state:'', zip_code:'', bedrooms:'', bathrooms:'', sqft:'', ical_url:'', platform:'AIRBNB' }); await load(); }
    else setMsg(r.error || 'Error adding property');
    setSaving(false);
  }

  async function syncCalendar(propertyId: string) {
    setSyncing(propertyId);
    const token = localStorage.getItem('token') || '';
    await fetch(getApiBase() + `/admin/properties/${propertyId}/sync-calendar`, { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {});
    setSyncing(null);
    await load();
  }

  const card = (p = '20px') => ({ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, padding: p });
  const inp = { height: 42, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 12px', fontSize: 13, color: C.ink, outline: 'none', width: '100%', boxSizing: 'border-box' as const };

  // Stats
  const totalProps = properties.length;
  const activeProps = properties.filter(p => p.is_active).length;
  const withIcal = properties.filter(p => p.ical_url).length;
  const pendingCleanings = bookings.length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('admin.airbnb.kicker')}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: C.ink }}>{t('admin.airbnb.title')}</h1>
          <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>{t('admin.airbnb.subtitle')}</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} style={{ padding: '10px 20px', borderRadius: 9999, border: 0, background: C.green, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{'+ ' + t('admin.airbnb.addProperty')}</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: t('admin.airbnb.totalProperties'), val: totalProps, mark: 'PR', color: C.navy },
          { label: t('admin.airbnb.activeProperties'), val: activeProps, mark: 'ON', color: C.green },
          { label: t('admin.airbnb.icalConnected'), val: withIcal, mark: 'IC', color: C.blue },
          { label: t('admin.airbnb.pendingCleanings'), val: pendingCleanings, mark: 'PC', color: pendingCleanings > 0 ? C.warning : C.muted },
        ].map(s => (
          <div key={s.label} style={card('20px')}>
            <div style={{ marginBottom: 8 }}><MarkBadge mark={s.mark} color={s.color}/></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Add Property Form */}
      {showAdd && (
        <div style={{ ...card('24px'), marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>Add Property</h3>
          {msg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: msg.includes('Error')||msg.includes('Failed') ? '#FEF2F2' : '#F0FDF4', color: msg.includes('Error')||msg.includes('Failed') ? C.danger : C.greenDk, fontSize: 13 }}>{msg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['name','Property Name'],['address','Address'],['city','City'],['state','State'],['zip_code','ZIP'],['bedrooms','Bedrooms'],['bathrooms','Bathrooms'],['sqft','Sqft']].map(([k,l]) => (
              <div key={k}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>{l}</label>
                <input value={(form as any)[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} style={inp} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({...f,platform:e.target.value}))} style={{...inp,height:42}}>
                {['AIRBNB','VRBO','BOOKING','MANUAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>iCal URL (Airbnb / VRBO)</label>
            <input value={form.ical_url} onChange={e => setForm(f => ({...f,ical_url:e.target.value}))} placeholder="https://www.airbnb.com/calendar/ical/..." style={inp} />
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>{t('admin.airbnb.icalHelp')}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => { setShowAdd(false); setMsg(''); }} style={{ flex: 1, padding: '10px 0', borderRadius: 9999, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={addProperty} disabled={saving||!form.name} style={{ flex: 2, padding: '10px 0', borderRadius: 9999, border: 0, background: C.green, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving||!form.name ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Add Property'}</button>
          </div>
        </div>
      )}

      {/* Properties List */}
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : (
        <>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: C.ink }}>{t('admin.airbnb.properties')} ({properties.length})</h3>
          {properties.length === 0
            ? <div style={{ ...card('60px'), textAlign: 'center', color: C.muted, marginBottom: 16 }}>{t('admin.airbnb.noProperties')}</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14, marginBottom: 16 }}>
                {properties.map((p: any) => {
                  const plat = PLATFORM_COLORS[p.platform] || PLATFORM_COLORS.MANUAL;
                  return (
                    <div key={p.id} style={card('20px')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{p.city}, {p.state} {p.zip_code}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ ...plat, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{p.platform || 'MANUAL'}</span>
                          <span style={{ borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 600, background: p.is_active ? '#D1FAE5' : '#F1F5F9', color: p.is_active ? '#065F46' : C.muted }}>{p.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                        {[{l:'Beds',v:p.bedrooms||'-'},{l:'Baths',v:p.bathrooms||'-'},{l:'Sqft',v:p.sqft||'-'}].map(s => (
                          <div key={s.l} style={{ background: C.soft, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{s.l}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                      {p.ical_url
                        ? <div style={{ fontSize: 11, color: C.blue, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>iCal: {p.ical_url.slice(0,40)}...</div>
                        : <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{t('admin.airbnb.noIcal')}</div>}
                      <button onClick={() => syncCalendar(p.id)} disabled={syncing === p.id || !p.ical_url} style={{ width: '100%', padding: '8px 0', borderRadius: 9999, border: `1px solid ${C.border}`, background: syncing === p.id ? C.soft : '#fff', color: C.navy, fontSize: 12, fontWeight: 600, cursor: p.ical_url ? 'pointer' : 'not-allowed', opacity: !p.ical_url ? 0.5 : 1 }}>
                        {syncing === p.id ? t('admin.airbnb.syncing') : t('admin.airbnb.syncCalendar')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          {/* {t('admin.airbnb.masterCalendar')} hint */}
          <div style={{ ...card('20px'), display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg,#F0FDF4,#EFF6FF)' }}>
            <MarkBadge mark="MC" color={C.blue}/>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{t('admin.airbnb.masterCalendar')}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{t('admin.airbnb.masterText')}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
