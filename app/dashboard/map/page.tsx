'use client';
import dynamic from 'next/dynamic';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[60vh] ec-card text-[#64748B] text-sm">Loading Google Maps...</div>,
});

export default function MapPage() {
  const { t } = useTranslation();
  return (
    <div className="ec-page">
      <div className="ec-page-header">
        <div>
          <p className="ec-eyebrow">{t('sidebar.liveMap')}</p>
          <h1 className="ec-title">{t('admin.map.title')}</h1>
          <p className="ec-subtitle">{t('admin.map.subtitle')}</p>
        </div>
        <div className="ec-pill bg-emerald-100 text-emerald-700">{t('admin.map.autoRefresh')}</div>
      </div>
      <div className="h-[calc(100vh-160px)] min-h-[520px]">
        <LiveMap />
      </div>
    </div>
  );
}
