'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Professional {
  id: string;
  fullName: string;
  lat: string | number;
  lng: string | number;
  isAvailable: boolean;
  hourlyRate: string | number;
  avgRating: string | number;ba
  totalServices: number;
  phone?: string;
}

interface Booking {
  id: string;
  address: string;
  status: string;
  scheduledAt?: string;
  sqft?: number;
  serviceType?: string;
  company?: { name?: string; contactName?: string };
  professionals?: Array<{ professional?: { fullName?: string } }>;
  lat?: number;
  lng?: number;
}

interface MapPin {
  id: string;
  lat: number;
  lng: number;
  type: 'professional' | 'booking';
  data: Professional | Booking;
}

// ─── Status colours ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING_ASSIGNMENT: '#F59E0B',
  CONFIRMED: '#3B82F6',
  IN_PROGRESS: '#8B5CF6',
  COMPLETED: '#10B981',
  CANCELLED: '#EF4444',
  INVITED: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_ASSIGNMENT: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  INVITED: 'Invitado',
};

// ─── Geocode helper (OpenStreetMap Nominatim – free, no key) ────────────────
const geocodeCache: Record<string, { lat: number; lng: number }> = {};

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null;
  const key = address.toLowerCase().trim();
  if (geocodeCache[key]) return geocodeCache[key];
  try {
    const q = encodeURIComponent(address + ', New Jersey, USA');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'EverClean-Admin/1.0' } }
    );
    const data = await res.json();
    if (data && data[0]) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[key] = result;
      return result;
    }
  } catch { /* silent fail */ }
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LiveMap() {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pros: 0, available: 0, bookings: 0, inProgress: 0 });
  const [filterType, setFilterType] = useState<'all' | 'professional' | 'booking'>('all');
  const leafletRef = useRef<any>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [prosRes, bookingsRes] = await Promise.all([
        fetch(`${API}/professionals`, { headers }),
        fetch(`${API}/bookings?limit=50`, { headers }),
      ]);

      const prosData = await prosRes.json();
      const bookingsData = await bookingsRes.json();

      const professionals: Professional[] = Array.isArray(prosData)
        ? prosData
        : prosData.data || [];
      const bookings: Booking[] = Array.isArray(bookingsData)
        ? bookingsData
        : bookingsData.data || [];

      const newPins: MapPin[] = [];

      // Professional pins
      let availableCount = 0;
      for (const p of professionals) {
        const lat = parseFloat(String(p.lat));
        const lng = parseFloat(String(p.lng));
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          newPins.push({ id: `pro-${p.id}`, lat, lng, type: 'professional', data: p });
          if (p.isAvailable) availableCount++;
        }
      }

      // Booking pins (geocode if no lat/lng)
      let inProgressCount = 0;
      const geocodeQueue = bookings.filter(
        b => !['COMPLETED', 'CANCELLED'].includes(b.status) && b.address
      );

      for (const b of geocodeQueue) {
        if (b.status === 'IN_PROGRESS') inProgressCount++;
        let coords: { lat: number; lng: number } | null = null;
        if (b.lat && b.lng) {
          coords = { lat: b.lat, lng: b.lng };
        } else if (b.address) {
          coords = await geocodeAddress(b.address);
        }
        if (coords) {
          newPins.push({
            id: `booking-${b.id}`,
            lat: coords.lat,
            lng: coords.lng,
            type: 'booking',
            data: b,
          });
        }
      }

      setPins(newPins);
      setStats({
        pros: professionals.length,
        available: availableCount,
        bookings: geocodeQueue.length,
        inProgress: inProgressCount,
      });
    } catch (e) {
      console.error('LiveMap load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      leafletRef.current = L;

      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [40.7357, -74.1724], // Newark, NJ
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      loadData();
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loadData]);

  // ── Update markers when pins change ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = pins.filter(p => filterType === 'all' || p.type === filterType);

    filtered.forEach(pin => {
      const isPro = pin.type === 'professional';
      const pro = pin.data as Professional;
      const booking = pin.data as Booking;

      const bgColor = isPro
        ? (pro.isAvailable ? '#10B981' : '#6B7280')
        : (STATUS_COLORS[booking.status] || '#6B7280');

      const emoji = isPro ? '👷' : '🏠';
      const size = isPro ? 38 : 34;

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:${size}px; height:${size}px;
            background:${bgColor};
            border:3px solid rgba(255,255,255,0.9);
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 4px 12px rgba(0,0,0,0.4);
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
          ">
            <span style="transform:rotate(45deg); font-size:${size * 0.45}px; line-height:1;">
              ${emoji}
            </span>
          </div>
          <div style="
            position:absolute; bottom:-6px; left:50%;
            transform:translateX(-50%);
            width:8px; height:8px;
            background:${bgColor};
            border-radius:50%;
            box-shadow:0 0 6px ${bgColor};
          "></div>
        `,
        iconSize: [size, size + 8],
        iconAnchor: [size / 2, size + 8],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(mapRef.current);
      marker.on('click', () => setSelected(pin));
      markersRef.current.push(marker);
    });
  }, [pins, filterType]);

  // ── Sidebar info panel ───────────────────────────────────────────────────
  const renderInfo = () => {
    if (!selected) return (
      <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
        <p style={{ fontSize: 13 }}>Haz clic en un pin para ver detalles</p>
      </div>
    );

    if (selected.type === 'professional') {
      const p = selected.data as Professional;
      return (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D2B52, #123E77)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>👷</div>
            <div>
              <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 14 }}>{p.fullName}</div>
              <div style={{ fontSize: 11, color: p.isAvailable ? '#10B981' : '#9CA3AF' }}>
                {p.isAvailable ? '🟢 Disponible' : '⚫ No disponible'}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Tarifa', value: `$${p.hourlyRate}/h` },
              { label: 'Rating', value: `⭐ ${parseFloat(String(p.avgRating)).toFixed(1)}` },
              { label: 'Servicios', value: String(p.totalServices) },
              { label: 'Teléfono', value: p.phone || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(0,0,0,0.04)', borderRadius: 8,
                padding: '8px 10px',
              }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const b = selected.data as Booking;
    const assignedPro = b.professionals?.[0]?.professional?.fullName;
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: STATUS_COLORS[b.status] || '#6B7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>🏠</div>
          <div>
            <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 13 }}>
              {b.company?.contactName || b.company?.name || 'Cliente'}
            </div>
            <div style={{
              fontSize: 11, color: STATUS_COLORS[b.status] || '#9CA3AF',
              fontWeight: 600,
            }}>
              {STATUS_LABELS[b.status] || b.status}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          📍 {b.address}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Fecha', value: b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('es') : '—' },
            { label: 'Hora', value: b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—' },
            { label: 'Sqft', value: b.sqft ? `${b.sqft} ft²` : '—' },
            { label: 'Profesional', value: assignedPro || 'Sin asignar' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(0,0,0,0.04)', borderRadius: 8,
              padding: '8px 10px',
            }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
        {b.status === 'PENDING_ASSIGNMENT' && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, fontSize: 12, color: '#F59E0B',
          }}>
            ⏳ En espera de subasta
          </div>
        )}
      </div>
    );
  };

  // ── Legend ───────────────────────────────────────────────────────────────
  const legend = [
    { color: '#10B981', label: 'Pro disponible' },
    { color: '#6B7280', label: 'Pro ocupado' },
    { color: '#F59E0B', label: 'Pendiente asignación' },
    { color: '#3B82F6', label: 'Confirmado' },
    { color: '#8B5CF6', label: 'En curso' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── Stats bar ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, padding: '12px 0', marginBottom: 12,
      }}>
        {[
          { label: 'Profesionales', value: stats.pros, icon: '👷', color: '#0D2B52' },
          { label: 'Disponibles', value: stats.available, icon: '🟢', color: '#065F46' },
          { label: 'Servicios activos', value: stats.bookings, icon: '📋', color: '#1E3A5F' },
          { label: 'En curso', value: stats.inProgress, icon: '⚡', color: '#4C1D95' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: `linear-gradient(135deg, ${color}, rgba(255,255,255,0.05))`,
            border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>
                {loading ? '…' : value}
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Map + sidebar ── */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{
          flex: 1, borderRadius: 16, overflow: 'hidden',
          border: '1px solid #e5e7eb',
          position: 'relative',
        }}>
          {/* Filter buttons */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 1000,
            display: 'flex', gap: 6,
          }}>
            {(['all', 'professional', 'booking'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: '6px 12px', borderRadius: 20, border: 'none',
                background: filterType === t ? '#67C24A' : 'rgba(13,43,82,0.9)',
                color: '#1a1a1a', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}>
                {t === 'all' ? 'Todos' : t === 'professional' ? '👷 Pros' : '🏠 Servicios'}
              </button>
            ))}
          </div>

          {/* Reload button */}
          <button onClick={loadData} style={{
            position: 'absolute', top: 12, right: 12, zIndex: 1000,
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.9)', color: '#1a1a1a',
            fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(8px)',
          }} title="Actualizar mapa">🔄</button>

          {loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 999,
              background: 'rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1a1a1a', fontSize: 14, gap: 8,
            }}>
              <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
              Cargando mapa…
            </div>
          )}

          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            borderRadius: 10, padding: '8px 12px',
            border: '1px solid #e5e7eb',
          }}>
            {legend.map(({ color, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 10, color: '#333', marginBottom: 3,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{
          width: 240, background: 'rgba(255,255,255,0.9)',
          border: '1px solid #e5e7eb',
          borderRadius: 16, overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            fontSize: 12, fontWeight: 700, color: '#67C24A',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {selected ? 'Detalle del pin' : 'Información'}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            {renderInfo()}
          </div>
          {selected && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setSelected(null)} style={{
                width: '100%', padding: '8px', borderRadius: 8,
                background: 'rgba(0,0,0,0.05)', border: '1px solid #e5e7eb',
                color: '#666', fontSize: 12, cursor: 'pointer',
              }}>
                ✕ Cerrar
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-container { background: #f5f5f5; }
      `}</style>
    </div>
  );
}
