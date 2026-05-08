'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiBase } from '../../../lib/apiBase';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const C = {
  navy: '#0D3781',
  blue: '#1565C0',
  green: '#4CAF50',
  greenDk: '#388E3C',
  bg: '#F5F7FA',
  ink: '#0D1B2A',
  muted: '#64748B',
  border: '#E2E8F0',
  shadow: '0 2px 8px rgba(13,55,129,0.06)',
};

type Summary = {
  total_bookings?: number;
  total_revenue?: number;
  total_payouts?: number;
  total_fees?: number;
  avg_margin?: number;
  pending_count?: number;
  pending_amount?: number;
};

type StateRow = {
  state?: string;
  bookings?: number;
  revenue?: number;
  payouts?: number;
  fees?: number;
};

type BalanceRow = {
  amount?: number;
  currency?: string;
};

type FinancialData = {
  summary: Summary;
  byState: StateRow[];
  stripeAvailable: BalanceRow[];
  stripePending: BalanceRow[];
};

function money(value?: number | string | null) {
  const amount = Number(value || 0);
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function stripeMoney(rows: BalanceRow[]) {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0) / 100;
  return money(total);
}

function percent(value?: number | string | null) {
  const n = Number(value || 0);
  return `${n.toFixed(1)}%`;
}

function format(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);
}

export default function FinancialsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<FinancialData>({
    summary: {},
    byState: [],
    stripeAvailable: [],
    stripePending: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);
    setError('');

    try {
      const [summaryRes, stripeRes] = await Promise.all([
        fetch(`${getApiBase()}/payouts/admin/summary`, { headers }),
        fetch(`${getApiBase()}/stripe/dashboard`, { headers }),
      ]);

      if (!summaryRes.ok) throw new Error(`summary ${summaryRes.status}`);

      const summaryJson = await summaryRes.json();
      const stripeJson = stripeRes.ok ? await stripeRes.json() : {};

      setData({
        summary: summaryJson.summary || {},
        byState: summaryJson.by_state || summaryJson.byState || [],
        stripeAvailable: stripeJson.available || [],
        stripePending: stripeJson.pending || [],
      });
    } catch (e) {
      console.error('Financials load failed:', e);
      setError(t('admin.financials.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const cards = useMemo(() => [
    { label: t('admin.financials.totalRevenue'), value: money(data.summary.total_revenue), sub: format(t('admin.financials.totalBookings'), { count: String(data.summary.total_bookings || 0) }), color: C.navy, mark: 'TR', bg: '#E6F1FB' },
    { label: t('admin.financials.appEarnings'), value: money(data.summary.total_fees), sub: t('admin.financials.platformFees'), color: C.greenDk, mark: 'AE', bg: '#D1FAE5' },
    { label: t('admin.financials.proPayouts'), value: money(data.summary.total_payouts), sub: t('admin.financials.professionalShare'), color: C.blue, mark: 'PP', bg: '#DBEAFE' },
    { label: t('admin.financials.pendingPayouts'), value: money(data.summary.pending_amount), sub: format(t('admin.financials.pendingCount'), { count: String(data.summary.pending_count || 0) }), color: '#92400E', mark: 'PN', bg: '#FEF3C7' },
    { label: t('admin.financials.avgMargin'), value: percent(data.summary.avg_margin), sub: t('admin.financials.marginHelp'), color: '#6D28D9', mark: 'MG', bg: '#EDE9FE' },
    { label: t('admin.financials.stripeAvailable'), value: stripeMoney(data.stripeAvailable), sub: t('admin.financials.stripeBalance'), color: '#047857', mark: 'ST', bg: '#ECFDF5' },
  ], [data, t]);

  return (
    <div style={{ width: '100%', maxWidth: 1480, margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .financial-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .financial-body { display: grid; grid-template-columns: minmax(0, 1.2fr) 360px; gap: 16px; margin-top: 16px; }
        @media (max-width: 1180px) {
          .financial-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .financial-body { grid-template-columns: 1fr; }
        }
        @media (max-width: 680px) {
          .financial-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 4px', color: C.greenDk, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('admin.financials.kicker')}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px,2.8vw,34px)', fontWeight: 700, color: C.ink }}>{t('admin.financials.title')}</h1>
          <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 14 }}>{t('admin.financials.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={load} style={secondaryButton}>{loading ? t('common.loading') : t('common.refresh')}</button>
          <a href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer" style={primaryButton}>{t('admin.financials.openStripe')}</a>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 14, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', borderRadius: 12, padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div className="financial-grid">
        {cards.map(card => (
          <div key={card.label} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, padding: 20, minHeight: 122 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{card.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: card.color, lineHeight: 1 }}>{loading ? '...' : card.value}</div>
                <div style={{ marginTop: 8, color: C.muted, fontSize: 12 }}>{card.sub}</div>
              </div>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: card.bg, color: card.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{card.mark}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="financial-body">
        <section style={panel}>
          <div style={panelHeader}>
            <div>
              <h2 style={panelTitle}>{t('admin.financials.byState')}</h2>
              <p style={panelText}>{t('admin.financials.byStateHelp')}</p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  {[t('admin.financials.state'), t('admin.financials.bookings'), t('admin.financials.revenue'), t('admin.financials.payouts'), t('admin.financials.fees')].map(head => (
                    <th key={head} style={th}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.byState.map(row => (
                  <tr key={row.state || 'state'}>
                    <td style={td}><strong>{row.state || '-'}</strong></td>
                    <td style={td}>{row.bookings || 0}</td>
                    <td style={td}>{money(row.revenue)}</td>
                    <td style={td}>{money(row.payouts)}</td>
                    <td style={{ ...td, color: C.greenDk, fontWeight: 800 }}>{money(row.fees)}</td>
                  </tr>
                ))}
                {!loading && data.byState.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...td, textAlign: 'center', padding: '42px 12px', color: C.muted }}>{t('admin.financials.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={panel}>
          <h2 style={panelTitle}>{t('admin.financials.stripeControl')}</h2>
          <p style={panelText}>{t('admin.financials.stripeHelp')}</p>

          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            <div style={{ ...stripeBox, background: '#ECFDF5' }}>
              <span style={stripeLabel}>{t('admin.financials.stripeAvailable')}</span>
              <strong style={{ color: '#047857' }}>{loading ? '...' : stripeMoney(data.stripeAvailable)}</strong>
            </div>
            <div style={{ ...stripeBox, background: '#EFF6FF' }}>
              <span style={stripeLabel}>{t('admin.financials.stripePending')}</span>
              <strong style={{ color: C.navy }}>{loading ? '...' : stripeMoney(data.stripePending)}</strong>
            </div>
          </div>

          <a href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer" style={{ ...primaryButton, width: '100%', justifyContent: 'center', marginTop: 18 }}>
            {t('admin.financials.openStripe')}
          </a>
        </aside>
      </div>
    </div>
  );
}

const panel = {
  background: '#fff',
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  boxShadow: C.shadow,
  padding: 20,
};

const panelHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
};

const panelTitle = { margin: 0, fontSize: 17, color: C.ink, fontWeight: 800 };
const panelText = { margin: '6px 0 0', fontSize: 13, color: C.muted, lineHeight: 1.5 };

const th = {
  textAlign: 'left' as const,
  fontSize: 11,
  color: C.muted,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  padding: '12px 10px',
  borderBottom: `1px solid ${C.border}`,
};

const td = {
  padding: '14px 10px',
  borderBottom: `1px solid ${C.border}`,
  fontSize: 13,
  color: '#334155',
};

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 42,
  padding: '0 18px',
  borderRadius: 12,
  border: 0,
  background: C.green,
  color: '#fff',
  fontSize: 13,
  fontWeight: 800,
  textDecoration: 'none',
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(76,175,80,0.22)',
};

const secondaryButton = {
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  background: '#fff',
  color: C.navy,
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};

const stripeBox = {
  borderRadius: 12,
  padding: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const stripeLabel = {
  fontSize: 12,
  color: C.muted,
  fontWeight: 700,
};
