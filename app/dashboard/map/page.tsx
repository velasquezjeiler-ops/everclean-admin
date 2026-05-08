'use client';
import dynamic from 'next/dynamic';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', color: '#64748B', fontSize: 14 }}>
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  const { t } = useTranslation();
  return (
    <div style={{ width: '100%', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 4px', color: '#388E3C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('sidebar.liveMap')}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 600, color: '#0D1B2A', letterSpacing: '-0.01em' }}>{t('admin.map.title')}</h1>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: 14 }}>{t('admin.map.subtitle')}</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 9999, padding: '5px 12px', fontSize: 11, fontWeight: 600, background: '#D1FAE5', color: '#065F46' }}>
          {t('admin.map.autoRefresh')}
        </div>
      </div>
      <div style={{ height: 'calc(100vh - 160px)', minHeight: 520 }}>
        <LiveMap />
      </div>
    </div>
  );
}
