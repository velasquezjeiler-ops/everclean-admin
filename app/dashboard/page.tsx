'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { getApiBase } from '../../lib/apiBase';

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', bg:'#F5F7FA', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', shadow:'0 2px 8px rgba(13,55,129,0.06)' };
type Period = 'today' | 'week' | 'month';

function greeting(t: (k:string)=>string) {
  const h = new Date().getHours();
  if (h < 12) return t('admin.dashboard.goodMorning');
  if (h < 18) return t('admin.dashboard.goodAfternoon');
  return t('admin.dashboard.goodEvening');
}
function svcLabel(v?: string) {
  return (v||'Service').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}

const STATUS_STYLE: Record<string,{bg:string,color:string}> = {
  PENDING_ASSIGNMENT:{bg:'#FEF3C7',color:'#92400E'},
  CONFIRMED:{bg:'#DBEAFE',color:'#1E40AF'},
  IN_PROGRESS:{bg:'#EDE9FE',color:'#5B21B6'},
  COMPLETED:{bg:'#D1FAE5',color:'#065F46'},
  CANCELLED:{bg:'#FEE2E2',color:'#991B1B'},
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('today');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    setLoading(true);
    try {
      const [bR, pR, lR] = await Promise.all([
        fetch(getApiBase()+'/bookings?limit=100',{headers:{Authorization:'Bearer '+token}}),
        fetch(getApiBase()+'/professionals',{headers:{Authorization:'Bearer '+token}}),
        fetch(getApiBase()+'/leads?limit=100',{headers:{Authorization:'Bearer '+token}}),
      ]);
      const [bookings,pros,leads] = await Promise.all([bR.json(),pR.json(),lR.json()]);
      const allB = bookings.data||[]; const allP = pros.data||[]; const allL = leads.data||[];
      const now = new Date();
      const starts:Record<Period,Date> = {
        today: new Date(now.getFullYear(),now.getMonth(),now.getDate()),
        week: new Date(now.getTime()-7*864e5),
        month: new Date(now.getFullYear(),now.getMonth(),1),
      };
      const pB = allB.filter((b:any)=>new Date(b.created_at||b.scheduled_at)>=starts[period]);
      const completed = pB.filter((b:any)=>b.status==='COMPLETED');
      setData({
        periodBookings:pB.length, completed:completed.length,
        inProgress:allB.filter((b:any)=>b.status==='IN_PROGRESS').length,
        pending:allB.filter((b:any)=>b.status==='PENDING_ASSIGNMENT').length,
        revenue:completed.reduce((s:number,b:any)=>s+Number(b.client_price||b.total_amount||0),0).toFixed(0),
        totalPros:allP.length, availablePros:allP.filter((p:any)=>p.is_available).length,
        totalLeads:allL.length, recentBookings:allB.slice(0,6), recentLeads:allL.slice(0,5),
      });
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  },[period]);

  useEffect(()=>{load();},[load]);

  const periodLabels:Record<Period,string> = {
    today:t('admin.dashboard.today'), week:t('admin.dashboard.thisWeek'), month:t('admin.dashboard.thisMonth'),
  };

  const card = {background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow};

  return (
    <div style={{width:'100%',maxWidth:1480,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <p style={{margin:'0 0 4px',color:C.greenDk,fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('admin.dashboard.title')}</p>
          <h1 style={{margin:0,fontSize:'clamp(22px,2.8vw,32px)',fontWeight:600,color:C.ink,letterSpacing:'-0.01em'}}>{greeting(t)}, Admin</h1>
          <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>{t('admin.dashboard.subtitle')}</p>
        </div>
        <div style={{display:'flex',gap:4,background:'#EAF0F7',borderRadius:10,padding:4}}>
          {(['today','week','month'] as Period[]).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:'7px 16px',borderRadius:8,border:0,background:period===p?'#fff':'transparent',color:period===p?C.navy:C.muted,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s',boxShadow:period===p?C.shadow:'none'}}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
        {[
          {label:t('admin.dashboard.revenue'),value:`$${loading?'...':data?.revenue||0}`,sub:t('admin.dashboard.selectedPeriod'),color:C.green},
          {label:t('sidebar.bookings'),value:loading?'...':data?.periodBookings||0,sub:periodLabels[period],color:C.navy},
          {label:t('statuses.COMPLETED'),value:loading?'...':data?.completed||0,sub:t('admin.dashboard.finishedServices'),color:C.blue},
        ].map(s=>(
          <div key={s.label} style={{...card,padding:24}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12}}>{s.label}</div>
            <div style={{fontSize:36,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:6}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:t('statuses.IN_PROGRESS'),value:data?.inProgress||0,color:C.blue},
          {label:t('statuses.PENDING_ASSIGNMENT'),value:data?.pending||0,color:'#F59E0B'},
          {label:t('sidebar.professionals'),value:data?.totalPros||0,color:C.green},
          {label:t('sidebar.leads'),value:data?.totalLeads||0,color:'#7C3AED'},
        ].map(s=>(
          <div key={s.label} style={{...card,padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{s.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:s.color}}>{loading?'...':s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent bookings + leads */}
      <div style={{display:'grid',gridTemplateColumns:'1.35fr 0.9fr',gap:16}}>
        <div style={{...card,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h2 style={{margin:0,fontSize:16,fontWeight:600,color:C.ink}}>{t('admin.dashboard.recentBookings')}</h2>
            <Link href="/dashboard/bookings" style={{fontSize:12,fontWeight:600,color:C.blue,textDecoration:'none'}}>{t('admin.dashboard.viewAll')}</Link>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {(data?.recentBookings||[]).map((b:any)=>{
              const ss = STATUS_STYLE[b.status]||{bg:'#F1F5F9',color:'#475569'};
              return (
                <div key={b.id} style={{borderRadius:10,border:`1px solid ${C.border}`,background:'#F8FAFC',padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{svcLabel(b.service_type)}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.address}, {b.city}</div>
                  </div>
                  <span style={{flexShrink:0,borderRadius:9999,padding:'4px 10px',fontSize:11,fontWeight:600,background:ss.bg,color:ss.color}}>{t('statuses.'+b.status)}</span>
                </div>
              );
            })}
            {!loading&&!(data?.recentBookings||[]).length&&<div style={{padding:'40px 0',textAlign:'center',color:C.muted,fontSize:13}}>{t('admin.bookings.noBookings')}</div>}
          </div>
        </div>

        <div style={{...card,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h2 style={{margin:0,fontSize:16,fontWeight:600,color:C.ink}}>{t('admin.dashboard.commercialLeads')}</h2>
            <Link href="/dashboard/leads" style={{fontSize:12,fontWeight:600,color:C.blue,textDecoration:'none'}}>{t('admin.dashboard.viewAll')}</Link>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {(data?.recentLeads||[]).map((l:any)=>(
              <div key={l.id} style={{borderRadius:10,border:`1px solid ${C.border}`,background:'#F8FAFC',padding:'12px 14px'}}>
                <div style={{fontSize:13,fontWeight:600,color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.company_name||l.contact_name||'Lead'}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{l.city||'City'}, {l.state||'State'}</div>
                <div style={{marginTop:8,display:'inline-flex',borderRadius:9999,padding:'4px 10px',fontSize:11,fontWeight:600,background:'#FEF3C7',color:'#92400E'}}>{l.status||'NEW'}</div>
              </div>
            ))}
            {!loading&&!(data?.recentLeads||[]).length&&<p style={{textAlign:'center',color:C.muted,fontSize:13,padding:'40px 0'}}>{t('admin.dashboard.noLeads')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
