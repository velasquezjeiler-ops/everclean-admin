'use client';
import { useEffect, useState } from 'react';
import { getApiBase } from '../../../lib/apiBase';

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC', shadow:'0 2px 8px rgba(13,55,129,0.06)' };
const STATUS_STYLE: Record<string,{bg:string,color:string}> = {
  NEW:{bg:'#FEF3C7',color:'#92400E'}, REVIEWING:{bg:'#DBEAFE',color:'#1E40AF'},
  PROPOSAL_READY:{bg:'#EDE9FE',color:'#5B21B6'}, SENT:{bg:'#D1FAE5',color:'#065F46'},
  WON:{bg:'#D1FAE5',color:'#065F46'}, LOST:{bg:'#FEE2E2',color:'#991B1B'},
};

export default function RFQsPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ contact_name:'', contact_email:'', contact_phone:'', service_type:'OFFICE_CLEANING', city:'', state:'', zip_code:'', sqft:'', frequency:'WEEKLY', required_scope:'' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const token = localStorage.getItem('token') || '';
    const r = await fetch(getApiBase() + '/admin/rfqs', { headers: { Authorization: 'Bearer ' + token } }).then(d => d.json()).catch(() => ({ data: [] }));
    setRfqs(r.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createRFQ() {
    setCreating(true);
    const token = localStorage.getItem('token') || '';
    await fetch(getApiBase() + '/admin/rfqs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(form) });
    await load();
    setShowForm(false);
    setCreating(false);
  }

  const card = (p = '20px') => ({ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, padding: p });
  const inp = { height: 42, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 12px', fontSize: 13, color: C.ink, outline: 'none', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>B2B</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: C.ink }}>RFQ / Proposals</h1>
          <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>Manage commercial cleaning requests and proposals.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ padding: '10px 20px', borderRadius: 9999, border: 0, background: C.green, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ New RFQ</button>
      </div>

      {showForm && (
        <div style={{ ...card('24px'), marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>Create RFQ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['contact_name','Contact Name'],['contact_email','Email'],['contact_phone','Phone'],['city','City'],['state','State'],['zip_code','ZIP'],['sqft','Sqft']].map(([k,l]) => (
              <div key={k}><label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>{l}</label>
              <input value={(form as any)[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} style={inp}/></div>
            ))}
            <div><label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Service Type</label>
            <select value={form.service_type} onChange={e => setForm(f => ({...f,service_type:e.target.value}))} style={{...inp,height:42}}>
              {['OFFICE_CLEANING','POST_CONSTRUCTION','MEDICAL_CLEANING'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Frequency</label>
            <select value={form.frequency} onChange={e => setForm(f => ({...f,frequency:e.target.value}))} style={{...inp,height:42}}>
              {['WEEKLY','BI_WEEKLY','MONTHLY','ONE_TIME'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Scope of Work</label>
          <textarea value={form.required_scope} onChange={e => setForm(f => ({...f,required_scope:e.target.value}))} rows={3} style={{ ...inp, height: 'auto', padding: '10px 12px', resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 9999, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={createRFQ} disabled={creating} style={{ flex: 2, padding: '10px 0', borderRadius: 9999, border: 0, background: C.green, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{creating ? 'Creating...' : 'Create RFQ'}</button>
          </div>
        </div>
      )}

      <div style={card('0px')}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : rfqs.length === 0
          ? <div style={{ padding: 60, textAlign: 'center', color: C.muted }}>No RFQs yet. Create your first one above.</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: C.soft }}>
              {['Contact','Service','Location','Sqft','Frequency','Status','Price','Created'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rfqs.map((rfq: any) => (
                <tr key={rfq.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 16px' }}><div style={{ fontWeight: 600, color: C.ink }}>{rfq.contact_name}</div><div style={{ fontSize: 11, color: C.muted }}>{rfq.contact_email}</div></td>
                  <td style={{ padding: '12px 16px', color: C.ink }}>{(rfq.service_type||'').replace(/_/g,' ')}</td>
                  <td style={{ padding: '12px 16px', color: C.muted }}>{rfq.city}, {rfq.state}</td>
                  <td style={{ padding: '12px 16px', color: C.ink }}>{rfq.sqft || '-'}</td>
                  <td style={{ padding: '12px 16px', color: C.ink }}>{rfq.frequency || '-'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ ...STATUS_STYLE[rfq.status]||{bg:'#F1F5F9',color:C.muted}, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{rfq.status}</span></td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: C.green }}>{rfq.calculated_price ? `$${Number(rfq.calculated_price).toFixed(0)}` : '-'}</td>
                  <td style={{ padding: '12px 16px', color: C.muted }}>{rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </div>
  );
}
