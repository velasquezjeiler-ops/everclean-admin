'use client';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 520,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a1628',
      borderRadius: 16,
      color: 'rgba(255,255,255,0.5)',
      fontSize: 14,
      gap: 10,
    }}>
      Loading map...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#0a1628' }}>
      <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
        Live Map
      </h1>
      <div style={{ height: 600 }}>
        <LiveMap />
      </div>
    </div>
  );
}
