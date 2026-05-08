'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { getApiBase } from '../../../lib/apiBase';

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', shadow:'0 2px 8px rgba(13,55,129,0.06)' };

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export default function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const token = localStorage.getItem('token')||'';
    fetch(getApiBase()+'/leads?limit=100',{headers:{Authorization:'Bearer '+token}})
      .then(r=>r.json()).then(d=>{setLeads(d.data||[]);setLoading(false);});
  },[]);

  const open = leads.filter(l=>l.status!=='CONVERTED').length;
  const converted = leads.filter(l=>l.status==='CONVERTED').length;
  const card = {background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow};

  return (
    <div style={{width:'100%',maxWidth:1480,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <p style={{margin:'0 0 4px',color:'#388E3C',fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>{t('sidebar.leads')}</p>
          <h1 style={{margin:0,fontSize:'clamp(22px,2.8vw,32px)',fontWeight:600,color:C.ink}}>{t('admin.leads.title')}</h1>
          <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>{t('admin.leads.subtitle')}</p>
        </div>
        <div style={{borderRadius:9999,padding:'6px 14px',fontSize:12,fontWeight:600,background:'#EAF4FF',color:C.navy}}>{leads.length} {t('admin.bookings.records')}</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:t('admin.leads.totalLeads'),value:leads.length,color:C.navy},
          {label:t('admin.leads.openLeads'),value:open,color:'#F59E0B'},
          {label:t('admin.leads.converted'),value:converted,color:C.green},
        ].map(s=>(
          <div key={s.label} style={{...card,padding:24}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>{s.label}</div>
            <div style={{fontSize:32,fontWeight:700,color:s.color}}>{loading?'...':s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:C.muted}}>Loading...</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {leads.map(l=>{
            const email = firstText(l.contact_email, l.contactEmail, l.email, l.contact?.email);
            const phone = firstText(l.contact_phone, l.contactPhone, l.phone, l.contact?.phone);
            const contactLine = [email, phone].filter(Boolean).join(' · ') || '-';
            const company = firstText(l.company_name, l.companyName, l.business_name, l.businessName, l.contact_name, l.contactName) || 'Lead';
            const source = firstText(l.source_channel, l.sourceChannel, l.source) || 'WEB';

            return (
              <div key={l.id} style={{...card,padding:20}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:600,color:C.ink,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{company}</div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{contactLine}</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <span style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:600,background:'#F1F5F9',color:'#475569'}}>{source}</span>
                      <span style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:600,background:'#F1F5F9',color:'#475569'}}>{l.created_at?new Date(l.created_at).toLocaleDateString():''}</span>
                    </div>
                  </div>
                  <span style={{flexShrink:0,borderRadius:9999,padding:'4px 12px',fontSize:11,fontWeight:700,background:'#FEF3C7',color:'#92400E'}}>{l.status||'NEW'}</span>
                </div>
              </div>
            );
          })}
          {!leads.length&&<div style={{gridColumn:'1/-1',padding:'60px 0',textAlign:'center',color:C.muted,fontSize:14}}>{t('admin.dashboard.noLeads')}</div>}
        </div>
      )}
    </div>
  );
}
