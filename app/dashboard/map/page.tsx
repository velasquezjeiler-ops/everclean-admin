'use client';
import dynamic from 'next/dynamic';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[60vh] bg-white rounded-xl border text-gray-400 text-sm">Loading Google Maps...</div>,
});

export default function MapPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('admin.map.title')}</h1>
      <div className="h-[calc(100vh-140px)] min-h-[400px]">
        <LiveMap />
      </div>
    </div>
  );
}
