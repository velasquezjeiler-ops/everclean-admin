'use client';
import dynamic from 'next/dynamic';

// Leaflet needs client-side only rendering
const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,43,82,0.4)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.5)', fontSize: 14, gap: 10,
    }}>
      <span style={{ fontSize: 24 }}>🗺️</span>
      Cargando mapa en vivo…
    </div>
  ),
});

export default function MapSection() {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
      }}>
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 800,
          color: '#fff', letterSpacing: '-0.03em',
        }}>
          📍 Mapa en vivo
        </h2>
        <span style={{
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(103,194,74,0.15)',
          border: '1px solid rgba(103,194,74,0.3)',
          color: '#67C24A', fontSize: 11, fontWeight: 700,
        }}>
          AUTO-REFRESH 30s
        </span>
      </div>

      <div style={{ height: 560 }}>
        <LiveMap />
      </div>
    </section>
  );
}
