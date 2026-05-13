'use client';
import { useEffect, useState } from 'react';
import { getApiBase } from '../../../lib/apiBase';
import { useTranslation } from '../../../lib/i18n/useTranslation';

function MarkBadge({ mark, color }: { mark: string; color: string }) { return <span style={{width:34,height:34,borderRadius:10,background:color+'14',border:'1px solid '+color+'33',color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{mark}</span>; }

const C = { navy:'#0D3781', blue:'#1565C0', green:'#4CAF50', greenDk:'#388E3C', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC', shadow:'0 2px 8px rgba(13,55,129,0.06)', warning:'#F59E0B', danger:'#DC2626' };

export default function WalletAdminPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    const h = { Authorization: 'Bearer ' + token };
    Promise.all([
      fetch(getApiBase() + '/admin/wallet/summary', { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch(getApiBase() + '/admin/wallet/transactions', { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([summary, t]) => {
      setData(summary);
      setTxns(t.data || []);
      setLoading(false);
    });
  }, []);

  const VIP_HOURLY_COST = 36;
  const liabilityUsd = data ? ((data.outstanding_minutes || 0) / 60 * VIP_HOURLY_COST) : 0;
  const card = (p = '20px') => ({ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, padding: p });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('admin.wallet.kicker')}</p>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: C.ink }}>{t('admin.wallet.title')}</h1>
        <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>{t('admin.wallet.subtitle')}</p>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
            {[
              { label: t('admin.wallet.activeMembers'), val: data?.active_members || 0, color: C.blue, mark: 'VM' },
              { label: t('admin.wallet.hoursIssued'), val: `${((data?.total_minutes_issued || 0)/60).toFixed(1)}h`, color: C.navy, mark: 'HI' },
              { label: t('admin.wallet.hoursConsumed'), val: `${((data?.total_minutes_consumed || 0)/60).toFixed(1)}h`, color: C.green, mark: 'HC' },
              { label: t('admin.wallet.outstandingLiability'), val: `${liabilityUsd.toFixed(0)}`, color: liabilityUsd > 5000 ? C.danger : C.warning, mark: 'OL' },
            ].map(s => (
              <div key={s.label} style={card('20px')}>
                <div style={{ marginBottom: 8 }}><MarkBadge mark={s.mark} color={s.color}/></div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={card('24px')}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>{t('admin.wallet.walletHealth')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { l: 'Outstanding minutes', v: `${data?.outstanding_minutes || 0} min` },
                  { l: 'Outstanding hours', v: `${((data?.outstanding_minutes||0)/60).toFixed(2)}h` },
                  { l: 'Liability @ $36/hr', v: `$${liabilityUsd.toFixed(2)}` },
                  { l: 'Avg hours per member', v: data?.active_members ? `${((data?.outstanding_minutes||0)/60/data.active_members).toFixed(1)}h` : '0h' },
                  { l: 'Risk level', v: liabilityUsd > 10000 ? t('admin.wallet.riskHigh') : liabilityUsd > 5000 ? t('admin.wallet.riskMedium') : t('admin.wallet.riskLow') },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                    <span style={{ color: C.muted }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: C.ink }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={card('24px')}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>{t('admin.wallet.topConsumers')}</h3>
              {(data?.top_consumers || []).length === 0
                ? <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted }}>{t('admin.common.noData')}</div>
                : (data?.top_consumers || []).map((u: any) => (
                  <div key={u.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                    <span style={{ color: C.ink }}>{u.email || u.user_id?.slice(0,8)}</span>
                    <span style={{ fontWeight: 600, color: C.blue }}>{(u.minutes/60).toFixed(1)}h used</span>
                  </div>
                ))}
            </div>
          </div>

          <div style={card('24px')}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: C.ink }}>{t('admin.wallet.recentTransactions')}</h3>
            {txns.length === 0
              ? <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted }}>{t('admin.wallet.noTransactions')}</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.soft }}>
                      {['User', 'Type', 'Minutes', 'Amount', 'Date'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 20).map((tx: any) => (
                      <tr key={tx.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '10px 12px', color: C.ink }}>{tx.user_email || tx.user_id?.slice(0,8)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 600, background: tx.type === 'SUBSCRIPTION_CREDIT' ? '#D1FAE5' : '#DBEAFE', color: tx.type === 'SUBSCRIPTION_CREDIT' ? '#065F46' : '#1E40AF' }}>{tx.type}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: tx.minutes > 0 ? C.green : C.danger, fontWeight: 600 }}>{tx.minutes > 0 ? '+' : ''}{tx.minutes}</td>
                        <td style={{ padding: '10px 12px', color: C.ink }}>{tx.amount_usd ? `$${Number(tx.amount_usd).toFixed(2)}` : '-'}</td>
                        <td style={{ padding: '10px 12px', color: C.muted }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}
    </div>
  );
}
