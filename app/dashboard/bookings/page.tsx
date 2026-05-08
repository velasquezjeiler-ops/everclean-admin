'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { getApiBase } from '../../../lib/apiBase';

const C = {
  navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', ink:'#0D1B2A',
  muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC',
  shadow:'0 2px 8px rgba(13,55,129,0.06)'
};

const STATUS_STYLE: Record<string,{bg:string,color:string}> = {
  PENDING_ASSIGNMENT:{bg:'#FEF3C7',color:'#92400E'},
  CONFIRMED:{bg:'#DBEAFE',color:'#1E40AF'},
  IN_PROGRESS:{bg:'#EDE9FE',color:'#5B21B6'},
  COMPLETED:{bg:'#D1FAE5',color:'#065F46'},
  CANCELLED:{bg:'#FEE2E2',color:'#991B1B'},
};

function serviceLabel(value?: string) {
  return (value || 'Service').replace(/_/g,' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function serviceCode(value?: string) {
  return (value || 'EC').split('_').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function fullAddress(b: any) {
  return [b.address, b.city, b.state].filter(Boolean).join(', ') || '-';
}

export default function BookingsPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pros, setPros] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedPro, setSelectedPro] = useState<Record<string,string>>({});

  async function load() {
    const token = localStorage.getItem('token') || '';
    const [bookingsRes, prosRes] = await Promise.all([
      fetch(getApiBase() + '/bookings?limit=100', { headers:{ Authorization:'Bearer ' + token } }).then(r => r.json()),
      fetch(getApiBase() + '/professionals', { headers:{ Authorization:'Bearer ' + token } }).then(r => r.json()),
    ]);
    setBookings(bookingsRes.data || []);
    setPros(prosRes.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function assignPro(bookingId: string) {
    const professionalId = selectedPro[bookingId];
    if (!professionalId) return;
    const token = localStorage.getItem('token') || '';
    await fetch(getApiBase() + `/bookings/${bookingId}/assign`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + token },
      body: JSON.stringify({ professionalId }),
    });
    setAssigning(null);
    await load();
  }

  const pending = bookings.filter(b => b.status === 'PENDING_ASSIGNMENT').length;
  const active = bookings.filter(b => ['CONFIRMED','IN_PROGRESS'].includes(b.status)).length;
  const revenue = bookings.reduce((sum, b) => sum + Number(b.client_price || b.total_amount || 0), 0);
  const card = { background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, boxShadow:C.shadow };

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

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:16,marginBottom:24}}>
        {[
          {label:t('admin.bookings.totalBookings'),value:bookings.length,color:C.navy},
          {label:t('statuses.PENDING_ASSIGNMENT'),value:pending,color:'#F59E0B'},
          {label:t('admin.bookings.activeWork'),value:active,color:C.green},
          {label:t('admin.bookings.totalRevenue'),value:`$${revenue.toFixed(0)}`,color:C.blue},
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
          {bookings.map(booking => {
            const status = STATUS_STYLE[booking.status] || {bg:'#F1F5F9',color:'#475569'};
            const proName = booking.professionals?.[0]?.professional?.fullName || booking.professional?.fullName || t('admin.bookings.unassigned');
            const assigningThis = assigning === booking.id;

            return (
              <section key={booking.id} style={{...card,background:C.soft,padding:16}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                  <div style={{width:48,height:48,borderRadius:10,background:'#EAF0F7',color:C.navy,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16,flexShrink:0}}>
                    {serviceCode(booking.service_type)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{serviceLabel(booking.service_type)}</div>
                        <div style={{fontSize:12,color:C.blue,marginTop:3,textTransform:'uppercase',letterSpacing:'0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fullAddress(booking)}</div>
                      </div>
                      <span style={{borderRadius:9999,padding:'5px 12px',fontSize:11,fontWeight:700,background:status.bg,color:status.color,whiteSpace:'nowrap'}}>
                        {t('statuses.' + booking.status)}
                      </span>
                    </div>

                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
                      <span style={chipStyle}>{booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleDateString() : '-'}</span>
                      <span style={chipStyle}>{Number(booking.sqft || 0).toFixed(0)} sqft</span>
                      <span style={{...chipStyle,background:'#D1FAE5',color:'#065F46'}}>${Number(booking.client_price || booking.total_amount || 0).toFixed(2)}</span>
                    </div>

                    {assigningThis ? (
                      <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,marginTop:14}}>
                        <select value={selectedPro[booking.id] || ''} onChange={e=>setSelectedPro(p=>({...p,[booking.id]:e.target.value}))} style={{height:40,border:`1px solid ${C.border}`,borderRadius:10,padding:'0 12px',fontSize:12,background:'#fff',outline:'none'}}>
                          <option value="">{t('admin.bookings.selectPro')}</option>
                          {pros.map(pro => <option key={pro.id} value={pro.id}>{pro.full_name || pro.fullName}</option>)}
                        </select>
                        <button onClick={()=>assignPro(booking.id)} style={smallPrimary}>{t('common.confirm')}</button>
                        <button onClick={()=>setAssigning(null)} style={smallSecondary}>{t('common.cancel')}</button>
                      </div>
                    ) : (
                      <div style={{display:'grid',gridTemplateColumns:booking.status === 'PENDING_ASSIGNMENT' ? '1fr 1fr' : '1fr',gap:8,marginTop:14}}>
                        <div style={proBox}>{proName}</div>
                        {booking.status === 'PENDING_ASSIGNMENT' && (
                          <button onClick={()=>setAssigning(booking.id)} style={primaryButton}>{t('admin.bookings.assign')}</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
          {!bookings.length && <div style={{gridColumn:'1/-1',...card,padding:'60px 0',textAlign:'center',color:C.muted,fontSize:14}}>{t('admin.bookings.noBookings')}</div>}
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

const proBox = {
  border:'1px solid #E2E8F0',
  background:'#fff',
  borderRadius:10,
  padding:'11px 12px',
  color:'#0D1B2A',
  fontSize:12,
  fontWeight:600,
  minWidth:0,
  overflow:'hidden',
  textOverflow:'ellipsis',
  whiteSpace:'nowrap' as const,
};

const primaryButton = {
  border:0,
  borderRadius:10,
  background:'#0D3781',
  color:'#fff',
  padding:'11px 14px',
  fontSize:12,
  fontWeight:700,
  cursor:'pointer',
};

const smallPrimary = { ...primaryButton, background:'#4CAF50', padding:'0 14px' };
const smallSecondary = { ...primaryButton, background:'#fff', color:'#64748B', border:'1px solid #E2E8F0', padding:'0 14px' };
