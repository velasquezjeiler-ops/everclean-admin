'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { getApiBase } from '../../../lib/apiBase';

const C = {
  navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', ink:'#0D1B2A',
  muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC',
  shadow:'0 2px 8px rgba(13,55,129,0.06)'
};

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase() || 'PR';
}

export default function ProfessionalsPage() {
  const { t } = useTranslation();
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(getApiBase() + '/professionals', { headers:{ Authorization:'Bearer ' + token } })
      .then(r => r.json())
      .then(d => setPros(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const available = pros.filter(pro => pro.is_available).length;
  const avgRate = pros.length ? (pros.reduce((sum, pro) => sum + Number(pro.hourly_rate || pro.rate || 0), 0) / pros.length).toFixed(0) : 0;
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

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:16,marginBottom:24}}>
        {[
          {label:t('admin.professionals.totalPros'),value:pros.length,color:C.navy},
          {label:t('admin.professionals.available'),value:available,color:C.green},
          {label:t('admin.professionals.avgRate'),value:`$${avgRate}`,color:C.blue},
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
          {pros.map(pro => {
            const name = pro.full_name || pro.fullName || 'Professional';
            const isOpen = expanded === pro.id;
            const isAvailable = Boolean(pro.is_available);

            return (
              <section key={pro.id} style={{...card,background:C.soft,padding:16}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                  <div style={{width:48,height:48,borderRadius:'50%',background:isAvailable?'linear-gradient(135deg,#4CAF50,#1565C0)':'#EAF0F7',color:isAvailable?'#fff':C.navy,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,flexShrink:0}}>
                    {initials(name)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                        <div style={{fontSize:12,color:C.blue,marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{[pro.city, pro.state].filter(Boolean).join(', ') || '-'}</div>
                      </div>
                      <span style={{borderRadius:9999,padding:'5px 12px',fontSize:11,fontWeight:700,background:isAvailable?'#D1FAE5':'#F1F5F9',color:isAvailable?'#065F46':'#64748B',whiteSpace:'nowrap'}}>
                        {isAvailable ? t('admin.professionals.available') : t('admin.professionals.unavailable')}
                      </span>
                    </div>

                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
                      <span style={{...chipStyle,background:'#EAF4FF',color:C.navy}}>${pro.hourly_rate || pro.rate || 0}/hr</span>
                      <span style={chipStyle}>Rating {Number(pro.rating || 0).toFixed(1)}</span>
                      <span style={chipStyle}>{pro.total_services || pro.services_count || 0} services</span>
                    </div>

                    {isOpen && (
                      <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`,display:'grid',gap:10}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <div style={detailBox}><span style={labelStyle}>Phone</span><strong>{pro.phone || '-'}</strong></div>
                          <div style={detailBox}><span style={labelStyle}>Email</span><strong>{pro.email || '-'}</strong></div>
                        </div>
                        {Array.isArray(pro.service_types) && pro.service_types.length > 0 && (
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            {pro.service_types.map((service: string) => <span key={service} style={chipStyle}>{service.replace(/_/g,' ')}</span>)}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:14}}>
                      <button onClick={() => setExpanded(isOpen ? null : pro.id)} style={secondaryButton}>
                        {isOpen ? t('admin.professionals.less') : t('admin.professionals.more')}
                      </button>
                      {pro.phone ? (
                        <a href={`tel:${pro.phone}`} style={primaryLink}>{t('admin.professionals.call')}</a>
                      ) : (
                        <span style={{...primaryLink,opacity:0.55}}>No phone</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
          {!pros.length && <div style={{gridColumn:'1/-1',...card,padding:'60px 0',textAlign:'center',color:C.muted,fontSize:14}}>{t('admin.professionals.noPros')}</div>}
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

const labelStyle = {
  display:'block',
  color:'#64748B',
  fontSize:10,
  fontWeight:700,
  textTransform:'uppercase' as const,
  letterSpacing:'0.08em',
  marginBottom:4,
};

const detailBox = {
  border:'1px solid #E2E8F0',
  background:'#fff',
  borderRadius:10,
  padding:'10px 12px',
  color:'#0D1B2A',
  fontSize:12,
  minWidth:0,
};

const secondaryButton = {
  border:'1px solid #E2E8F0',
  borderRadius:10,
  background:'#fff',
  color:'#0D3781',
  padding:'11px 14px',
  fontSize:12,
  fontWeight:700,
  cursor:'pointer',
};

const primaryLink = {
  border:0,
  borderRadius:10,
  background:'#0D3781',
  color:'#fff',
  padding:'11px 14px',
  fontSize:12,
  fontWeight:700,
  textDecoration:'none',
  textAlign:'center' as const,
};
