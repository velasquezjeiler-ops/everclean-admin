'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { getApiBase } from '../../../lib/apiBase';

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', shadow:'0 2px 8px rgba(13,55,129,0.06)' };

const STATUS_STYLE: Record<string,{bg:string,color:string}> = {
  PENDING_ASSIGNMENT:{bg:'#FEF3C7',color:'#92400E'},
  CONFIRMED:{bg:'#DBEAFE',color:'#1E40AF'},
  IN_PROGRESS:{bg:'#EDE9FE',color:'#5B21B6'},
  COMPLETED:{bg:'#D1FAE5',color:'#065F46'},
  CANCELLED:{bg:'#FEE2E2',color:'#991B1B'},
};

function svcLabel(v?:string){return(v||'Service').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());}

export default function BookingsPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pros, setPros] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string|null>(null);
  const [selectedPro, setSelectedPro] = useState<Record<string,string>>({});

  useEffect(()=>{
    const token = localStorage.getItem('token')||'';
    Promise.all([
      fetch(getApiBase()+'/bookings?limit=100',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()),
      fetch(getApiBase()+'/professionals',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()),
    ]).then(([b,p])=>{setBookings(b.data||[]);setPros(p.data||[]);setLoading(false);});
  },[]);

  async function assignPro(bookingId:string) {
    const proId = selectedPro[bookingId];
    if (!proId) return;
    const token = localStorage.getItem('token')||'';
    await fetch(getApiBase()+`/bookings/${bookingId}/assign`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({professionalId:proId})});
    setAssigning(null);
    const r = await fetch(getApiBase()+'/bookings?limit=100',{headers:{Authorization:'Bearer '+token}});
    const d = await r.json();
    setBookings(d.data||[]);
  }

  const pending = bookings.filter(b=>b.status==='PENDING_ASSIGNMENT').length;
  const active = bookings.filter(b=>['CONFIRMED','IN_PROGRESS'].includes(b.status)).length;
  const card = {background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow};

  return (
    <div style={{width:'100%',maxWidth:1480,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <p style={{margin:'0 0 4px',color:'#388E3C',fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('sidebar.bookings')}</p>
          <h1 style={{margin:0,fontSize:'clamp(22px,2.8vw,32px)',fontWeight:600,color:C.ink}}>{t('admin.bookings.title')}</h1>
          <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>{t('admin.bookings.subtitle')}</p>
        </div>
        <div style={{borderRadius:9999,padding:'6px 14px',fontSize:12,fontWeight:600,background:'#EAF4FF',color:C.navy}}>{bookings.length} {t('admin.bookings.records')}</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:t('admin.bookings.totalBookings'),value:bookings.length,color:C.navy},
          {label:t('statuses.PENDING_ASSIGNMENT'),value:pending,color:'#F59E0B'},
          {label:t('admin.bookings.activeWork'),value:active,color:C.green},
        ].map(s=>(
          <div key={s.label} style={{...card,padding:24}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>{s.label}</div>
            <div style={{fontSize:32,fontWeight:700,color:s.color}}>{loading?'...':s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:C.muted}}>Loading…</div>
      ) : (
        <div style={{...card,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1.5fr 1fr',gap:0,padding:'12px 20px',borderBottom:`1px solid ${C.border}',background:'#F8FAFC`}}>
            {[t('admin.bookings.service'),t('admin.bookings.company'),t('admin.bookings.date'),t('admin.bookings.total'),t('admin.bookings.professional'),t('admin.bookings.status')].map(h=>(
              <div key={h} style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</div>
            ))}
          </div>
          {bookings.map((b,i)=>{
            const ss = STATUS_STYLE[b.status]||{bg:'#F1F5F9',color:'#475569'};
            const proName = b.professionals?.[0]?.professional?.fullName||b.professional?.fullName||'—';
            return (
              <div key={b.id} style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1.5fr 1fr',gap:0,padding:'14px 20px',borderBottom:i<bookings.length-1?`1px solid ${C.border}`:'none',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{svcLabel(b.service_type)}</div>
                <div style={{fontSize:12,color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.address||'—'}</div>
                <div style={{fontSize:12,color:C.muted}}>{b.scheduled_at?new Date(b.scheduled_at).toLocaleDateString():'—'}</div>
                <div style={{fontSize:13,fontWeight:600,color:C.green}}>${Number(b.client_price||b.total_amount||0).toFixed(0)}</div>
                <div>
                  {b.status==='PENDING_ASSIGNMENT' ? (
                    assigning===b.id ? (
                      <div style={{display:'flex',gap:6}}>
                        <select value={selectedPro[b.id]||''} onChange={e=>setSelectedPro(p=>({...p,[b.id]:e.target.value}))} style={{flex:1,fontSize:12,border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 8px',outline:'none'}}>
                          <option value="">Select pro</option>
                          {pros.map(p=><option key={p.id} value={p.id}>{p.full_name||p.fullName}</option>)}
                        </select>
                        <button onClick={()=>assignPro(b.id)} style={{padding:'4px 10px',borderRadius:6,border:0,background:C.green,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>✓</button>
                        <button onClick={()=>setAssigning(null)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${C.border}`,background:'#fff',color:C.muted,fontSize:11,cursor:'pointer'}}>✕</button>
                      </div>
                    ) : (
                      <button onClick={()=>setAssigning(b.id)} style={{padding:'5px 12px',borderRadius:9999,border:0,background:C.green,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>{t('admin.bookings.assign')}</button>
                    )
                  ) : (
                    <span style={{fontSize:12,color:C.ink}}>{proName}</span>
                  )}
                </div>
                <span style={{borderRadius:9999,padding:'4px 10px',fontSize:11,fontWeight:600,background:ss.bg,color:ss.color,display:'inline-flex'}}>{t('statuses.'+b.status)}</span>
              </div>
            );
          })}
          {!bookings.length&&<div style={{padding:'60px 0',textAlign:'center',color:C.muted,fontSize:14}}>{t('admin.bookings.noBookings')}</div>}
          <div style={{padding:'12px 20px',borderTop:`1px solid ${C.border}`,textAlign:'right',fontSize:13,fontWeight:600,color:C.muted}}>
            {t('admin.bookings.totalRevenue')}: <span style={{color:C.green}}>${bookings.reduce((s,b)=>s+Number(b.client_price||b.total_amount||0),0).toFixed(0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
