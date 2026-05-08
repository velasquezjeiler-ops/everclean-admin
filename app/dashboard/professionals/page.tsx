'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { getApiBase } from '../../../lib/apiBase';

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', shadow:'0 2px 8px rgba(13,55,129,0.06)' };

export default function ProfessionalsPage() {
  const { t } = useTranslation();
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(()=>{
    const token = localStorage.getItem('token')||'';
    fetch(getApiBase()+'/professionals',{headers:{Authorization:'Bearer '+token}})
      .then(r=>r.json()).then(d=>{setPros(d.data||[]);setLoading(false);});
  },[]);

  const available = pros.filter(p=>p.is_available).length;
  const avgRate = pros.length ? (pros.reduce((s,p)=>s+Number(p.hourly_rate||p.rate||0),0)/pros.length).toFixed(0) : 0;
  const card = {background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow};

  return (
    <div style={{width:'100%',maxWidth:1480,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <p style={{margin:'0 0 4px',color:'#388E3C',fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('sidebar.professionals')}</p>
          <h1 style={{margin:0,fontSize:'clamp(22px,2.8vw,32px)',fontWeight:600,color:C.ink}}>{t('admin.professionals.title')}</h1>
          <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>{t('admin.professionals.subtitle')}</p>
        </div>
        <div style={{borderRadius:9999,padding:'6px 14px',fontSize:12,fontWeight:600,background:'#EAF4FF',color:C.navy}}>{pros.length} {t('admin.bookings.records')}</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:t('admin.professionals.totalPros'),value:pros.length,color:C.navy},
          {label:t('admin.professionals.available'),value:available,color:C.green},
          {label:t('admin.professionals.avgRate'),value:`$${avgRate}`,color:C.blue},
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
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {pros.map(p=>{
            const name = p.full_name||p.fullName||'Pro';
            const initials = name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
            const isOpen = expanded===p.id;
            return (
              <div key={p.id} style={{...card,padding:20}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:C.green,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,flexShrink:0}}>{initials}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:600,color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                    <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}>
                      <span style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:600,background:p.is_available?'#D1FAE5':'#F1F5F9',color:p.is_available?'#065F46':'#64748B'}}>{p.is_available?t('admin.professionals.available'):t('admin.professionals.unavailable')}</span>
                      <span style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:600,background:'#EAF4FF',color:C.navy}}>${p.hourly_rate||p.rate||0}/hr</span>
                      <span style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:600,background:'#FEF3C7',color:'#92400E'}}>★ {Number(p.rating||0).toFixed(1)}</span>
                    </div>
                  </div>
                  <button onClick={()=>setExpanded(isOpen?null:p.id)} style={{padding:'5px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:'#fff',color:C.muted,fontSize:12,cursor:'pointer'}}>
                    {isOpen?t('admin.professionals.less'):t('admin.professionals.more')}
                  </button>
                </div>
                {isOpen&&(
                  <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`,display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div><span style={{fontSize:11,color:C.muted,fontWeight:600}}>Phone: </span><span style={{fontSize:13,color:C.ink,fontWeight:600}}>{p.phone||'—'}</span></div>
                      <div><span style={{fontSize:11,color:C.muted,fontWeight:600}}>Email: </span><span style={{fontSize:13,color:C.ink}}>{p.email||'—'}</span></div>
                      <div><span style={{fontSize:11,color:C.muted,fontWeight:600}}>City: </span><span style={{fontSize:13,color:C.ink}}>{p.city||'—'}, {p.state||'—'}</span></div>
                      <div><span style={{fontSize:11,color:C.muted,fontWeight:600}}>Services: </span><span style={{fontSize:13,color:C.ink}}>{p.total_services||p.services_count||0}</span></div>
                    </div>
                    {p.service_types?.length>0&&(
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                        {p.service_types.map((s:string)=><span key={s} style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:600,background:'#F1F5F9',color:'#475569'}}>{s.replace(/_/g,' ')}</span>)}
                      </div>
                    )}
                    <div style={{display:'flex',gap:8,marginTop:4}}>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${p.city},${p.state}`} target="_blank" rel="noreferrer" style={{padding:'7px 14px',borderRadius:9999,background:C.navy,color:'#fff',fontSize:12,fontWeight:600,textDecoration:'none'}}>
                        {t('admin.professionals.openMaps')}
                      </a>
                      {p.phone&&<a href={`tel:${p.phone}`} style={{padding:'7px 14px',borderRadius:9999,border:`1px solid ${C.border}`,color:C.ink,fontSize:12,fontWeight:600,textDecoration:'none'}}>{t('admin.professionals.call')}</a>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!pros.length&&<div style={{gridColumn:'1/-1',padding:'60px 0',textAlign:'center',color:C.muted,fontSize:14}}>{t('admin.professionals.noPros')}</div>}
        </div>
      )}
    </div>
  );
}
