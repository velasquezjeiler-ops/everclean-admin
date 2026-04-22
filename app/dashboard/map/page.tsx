'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 760,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        color: '#6b7280',
        fontSize: 14,
      }}
    >
      Cargando Google Maps...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f9fafb' }}>
      <h1
        style={{
          color: '#111827',
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        Live Map
      </h1>

      <div style={{ height: 780 }}>
        <LiveMap />
      </div>
    </div>
  );
}
