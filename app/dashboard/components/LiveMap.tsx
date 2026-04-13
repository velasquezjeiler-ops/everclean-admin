'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

interface Professional {
  id: string;
  full_name?: string;
  fullName?: string;
  lat: string | number | null;
  lng: string | number | null;
  is_available?: boolean;
  isAvailable?: boolean;
  hourly_rate?: string | number;
  hourlyRate?: string | number;
  avg_rating?: string | number;
  avgRating?: string | number;
  total_services?: number;
  totalServices?: number;
  phone?: string;
}

interface Booking {
  id: string;
  address: string;
  status: string;
  scheduledAt?: string;
  sqft?: number;
  company?: { name?: string; contactName?: string };
  professionals?: Array<{ professional?: { fullName?: string } }>;
  lat?: number;
  lng?: number;
}

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
  } catch { }
  return null;
}

export default function LiveMap() {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'professional' | 'booking' | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pros: 0, available: 0, bookings: 0, inProgress: 0 });
  const [filterType, setFilterType] = useState<'all' | 'professional' | 'booking'>('all');
  const [pins, setPins] = useState<any[]>([]);
  const leafletRef = useRef<any>(null);

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
      const professionals: Professional[] = Array.isArray(prosData) ? prosData : prosData.data || [];
      const bookings: Booking[] = Array.isArray(bookingsData) ? bookingsData : bookingsData.data || [];

      const newPins: any[] = [];
      let availableCount = 0;

      for (const p of professionals) {
        const lat = parseFloat(String(p.lat));
        const lng = parseFloat(String(p.lng));
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          const isAvail = p.is_available ?? p.isAvailable ?? false;
          if (isAvail) availableCount++;
          newPins.push({ id: `pro-${p.id}`, lat, lng, type: 'professional', data: p });
        }
      }

      let inProgressCount = 0;
      const activeBookings = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status) && b.address);
      for (const b of activeBookings) {
        if (b.status === 'IN_PROGRESS') inProgressCount++;
        let coords: { lat: number; lng: number } | null = null;
        if (b.lat && b.lng) coords = { lat: b.lat, lng: b.lng };
        else if (b.address) coords = await geocodeAddress(b.address);
        if (coords) newPins.push({ id: `booking-${b.id}`, lat: coords.lat, lng: coords.lng, type: 'booking', data: b });
      }

      setPins(newPins);
      setStats({ pros: professionals.length, available: availableCount, bookings: activeBookings.length, inProgress: inProgressCount });
    } catch (e) {
      console.error('LiveMap error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;
    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      leafletRef.current = L;
      if (!mapContainerRef.current) return;
      const map = L.map(mapContainerRef.current, {
        center: [40.7357, -74.1724],
        zoom: 11,
        zoomControl: true,
      });
      // Stadia Maps - Alidade Smooth (very similar to Google Maps)
      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 20,
      }).addTo(map);
      mapRef.current = map;
      loadData();
    };
    initMap();
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [loadData]);

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const filtered = pins.filter(p => filterType === 'all' || p.type === filterType);
    filtered.forEach(pin => {
      const isPro = pin.type === 'professional';
      const pro = pin.data as Professional;
      const booking = pin.data as Booking;
      const isAvail = isPro ? (pro.is_available ?? pro.isAvailable ?? false) : false;
      const color = isPro ? (isAvail ? '#10B981' : '#6B7280') : (STATUS_COLORS[booking.status] || '#6B7280');
      const emoji = isPro ? '👷' : '🏠';
      const size = 36;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;"><span style="transform:rotate(45deg);font-size:16px;line-height:1;">${emoji}</span></div>`,
        iconSize: [size, size + 8],
        iconAnchor: [size / 2, size + 8],
      });
      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(mapRef.current);
      marker.on('click', () => { setSelected(pin.data); setSelectedType(pin.type); });
      markersRef.current.push(marker);
    });
  }, [pins, filterType]);

  const renderInfo = () => {
    if (!selected) return (
      <div style={{ padding: 20, color: '#9CA3AF', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
        <p style={{ fontSize: 13 }}>Haz clic en un pin</p>
      </div>
    );
    if (selectedType === 'professional') {
      const p = selected as Professional;
      const name = p.full_name || p.fullName || 'Profesional';
      const rate = p.hourly_rate || p.hourlyRate || '—';
      const rating = parseFloat(String(p.avg_rating || p.avgRating || 0)).toFixed(1);
      const services = p.total_services ?? p.totalServices ?? 0;
      const isAvail = p.is_available ?? p.isAvailable ?? false;
      return (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👷</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
              <div style={{ fontSize: 11, color: isAvail ? '#10B981' : '#9CA3AF' }}>{isAvail ? '🟢 Disponible' : '⚫ No disponible'}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Tarifa', value: `$${rate}/h` },
              { label: 'Rating', value: `⭐ ${rating}` },
              { label: 'Servicios', value: String(services) },
              { label: 'Teléfono', value: p.phone || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f5f7fa', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    const b = selected as Booking;
    const assignedPro = b.professionals?.[0]?.professional?.fullName;
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: STATUS_COLORS[b.status] || '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{b.company?.contactName || b.company?.name || 'Cliente'}</div>
            <div style={{ fontSize: 11, color: STATUS_COLORS[b.status] || '#9CA3AF', fontWeight: 600 }}>{STATUS_LABELS[b.status] || b.status}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>📍 {b.address}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Fecha', value: b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('es') : '—' },
            { label: 'Hora', value: b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—' },
            { label: 'Sqft', value: b.sqft ? `${b.sqft} ft²` : '—' },
            { label: 'Profesional', value: assignedPro || 'Sin asignar' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f5f7fa', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
        {b.status === 'PENDING_ASSIGNMENT' && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
            ⏳ En espera de subasta
          </div>
        )}
      </div>
    );
  };

  const legend = [
    { color: '#10B981', label: 'Pro disponible' },
    { color: '#6B7280', label: 'Pro ocupado' },
    { color: '#F59E0B', label: 'Pendiente asignación' },
    { color: '#3B82F6', label: 'Confirmado' },
    { color: '#8B5CF6', label: 'En curso' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        {[
          { label: 'Profesionales', value: stats.pros, icon: '👷', color: '#E6F1FB' },
          { label: 'Disponibles', value: stats.available, icon: '🟢', color: '#D1FAE5' },
          { label: 'Servicios activos', value: stats.bookings, icon: '📋', color: '#EDE9FE' },
          { label: 'En curso', value: stats.inProgress, icon: '⚡', color: '#FEF3C7' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: color, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{loading ? '…' : value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', gap: 6 }}>
            {(['all', 'professional', 'booking'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: '6px 12px', borderRadius: 20, border: 'none',
                background: filterType === t ? '#10B981' : 'white',
                color: filterType === t ? 'white' : '#374151',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                {t === 'all' ? 'Todos' : t === 'professional' ? '👷 Pros' : '🏠 Servicios'}
              </button>
            ))}
          </div>
          <button onClick={loadData} style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'white', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} title="Actualizar">🔄</button>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              ⟳ Cargando mapa…
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />
          <div style={{ position: 'absolute', bottom: 30, left: 12, zIndex: 1000, background: 'white', borderRadius: 10, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {legend.map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#374151', marginBottom: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: 240, background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700, color: '#10B981', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {selected ? 'Detalle del pin' : 'Información'}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 360 }}>{renderInfo()}</div>
          {selected && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => { setSelected(null); setSelectedType(null); }} style={{ width: '100%', padding: 8, borderRadius: 8, background: '#f5f7fa', border: '1px solid #e5e7eb', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>
                ✕ Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`.leaflet-container { background: #f0f0f0; }`}</style>
    </div>
  );
}
