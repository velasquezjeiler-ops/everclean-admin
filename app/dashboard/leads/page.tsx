'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { getApiBase } from '../../../lib/apiBase';

const C = {
  navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', ink:'#0D1B2A',
  muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC',
  shadow:'0 2px 8px rgba(13,55,129,0.06)'
};

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function initials(value: string) {
  return value.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase() || 'LD';
}

export default function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(getApiBase() + '/leads?limit=100', { headers:{ Authorization:'Bearer ' + token } })
      .then(r => r.json())
      .then(d => setLeads(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const open = leads.filter(lead => lead.status !== 'CONVERTED').length;
  const converted = leads.filter(lead => lead.status === 'CONVERTED').length;
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

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:16,marginBottom:24}}>
        {[
          {label:t('admin.leads.totalLeads'),value:leads.length,color:C.navy},
          {label:t('admin.leads.openLeads'),value:open,color:'#F59E0B'},
          {label:t('admin.leads.converted'),value:converted,color:C.green},
        ].map(item => (
          <div key={item.label} style={{...card,padding:22}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>{item.label}</div>
            <div style={{fontSize:32,fontWeight:700,color:item.color,lineHeight:1}}>{loading ? '...' : item.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:220,color:C.muted}}>Loading...</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:14}}>
          {leads.map(lead => {
            const email = firstText(lead.contact_email, lead.contactEmail, lead.email, lead.contact?.email);
            const phone = firstText(lead.contact_phone, lead.contactPhone, lead.phone, lead.contact?.phone);
            const company = firstText(lead.company_name, lead.companyName, lead.business_name, lead.businessName, lead.contact_name, lead.contactName) || 'Lead';
            const contactLine = [email, phone].filter(Boolean).join(' / ') || '-';
            const source = firstText(lead.source_channel, lead.sourceChannel, lead.source) || 'WEB';
            const isConverted = lead.status === 'CONVERTED';

            return (
              <section key={lead.id} style={{...card,background:C.soft,padding:16}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                  <div style={{width:48,height:48,borderRadius:10,background:'#EAF0F7',color:C.navy,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:15,flexShrink:0}}>
                    {initials(company)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{company}</div>
                        <div style={{fontSize:12,color:C.muted,marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{contactLine}</div>
                      </div>
                      <span style={{borderRadius:9999,padding:'5px 12px',fontSize:11,fontWeight:700,background:isConverted?'#D1FAE5':'#FEF3C7',color:isConverted?'#065F46':'#92400E',whiteSpace:'nowrap'}}>
                        {lead.status || t('admin.leads.new')}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
                      <span style={chipStyle}>{source}</span>
                      <span style={chipStyle}>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}</span>
                      {(lead.city || lead.state) && <span style={{...chipStyle,background:'#EAF4FF',color:C.navy}}>{[lead.city, lead.state].filter(Boolean).join(', ')}</span>}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
          {!leads.length && <div style={{gridColumn:'1/-1',...card,padding:'60px 0',textAlign:'center',color:C.muted,fontSize:14}}>{t('admin.dashboard.noLeads')}</div>}
        </div>
      )}
    </div>
  );
}

const chipStyle = {
  border:'1px solid #E2E8F0',
  background:'#fff',
  borderRadius:9999,
  padding:'6px 10px',
  color:'#64748B',
  fontSize:12,
  fontWeight:600,
};
