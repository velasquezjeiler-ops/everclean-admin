'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useMapRefresh } from './useMapRefresh';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

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
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  status: string;
  scheduledAt?: string;
  sqft?: number;
  company?: { name?: string; contactName?: string };
  professionals?: Array<{ professional?: { fullName?: string } }>;
  lat?: number | string | null;
  lng?: number | string | null;
}

type PinType = 'professional' | 'booking';

interface PinItem {
  id: string;
  lat: number;
  lng: number;
  type: PinType;
  data: Professional | Booking;
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

const DEFAULT_CENTER = { lat: 40.7357, lng: -74.1724 };
const geocodeCache: Record<string, { lat: number; lng: number }> = {};

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function buildFullAddress(b: Booking) {
  return [b.address, b.city, b.state, b.zip].filter(Boolean).join(', ');
}

function googleMapsExternalUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null;

  const key = address.toLowerCase().trim();
  if (geocodeCache[key]) return geocodeCache[key];

  const googleRef = (window as any).google;
  if (!googleRef?.maps?.Geocoder) return null;

  const geocoder = new googleRef.maps.Geocoder();

  return new Promise(resolve => {
    geocoder.geocode({ address }, (results: any, status: string) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const result = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        geocodeCache[key] = result;
        resolve(result);
      } else {
        resolve(null);
      }
    });
  });
}

export default function LiveMap() {
  const mapRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'professional' | 'booking'>('all');
  const [pins, setPins] = useState<PinItem[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [stats, setStats] = useState({
    pros: 0,
    available: 0,
    bookings: 0,
    inProgress: 0,
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'everclean-google-map',
    googleMapsApiKey: apiKey,
  });

  const filteredPins = useMemo(
    () => pins.filter(pin => filterType === 'all' || pin.type === filterType),
    [pins, filterType]
  );

  const focusPin = useCallback((pin: PinItem | null, zoom = 17) => {
    if (!pin || !mapRef.current) return;
    mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
    mapRef.current.setZoom(zoom);
  }, []);

  const fitToPins = useCallback((items: PinItem[]) => {
    const googleRef = (window as any).google;
    if (!mapRef.current || !googleRef?.maps || items.length === 0) return;

    if (items.length === 1) {
      mapRef.current.panTo({ lat: items[0].lat, lng: items[0].lng });
      mapRef.current.setZoom(14);
      return;
    }

    const bounds = new googleRef.maps.LatLngBounds();
    items.forEach(pin => bounds.extend({ lat: pin.lat, lng: pin.lng }));
    mapRef.current.fitBounds(bounds);
  }, []);

  const loadData = useCallback(async () => {
    if (!isLoaded || !(window as any).google) return;

    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);

      const [prosRes, bookingsRes] = await Promise.all([
        fetch(`${API}/professionals`, { headers }),
        fetch(`${API}/bookings?limit=500`, { headers }),
      ]);

      const prosData = await prosRes.json();
      const bookingsData = await bookingsRes.json();

      const professionals: Professional[] = Array.isArray(prosData) ? prosData : prosData.data || [];
      const bookings: Booking[] = Array.isArray(bookingsData)
        ? bookingsData
        : bookingsData.data || [];

      const nextPins: PinItem[] = [];
      let availableCount = 0;

      for (const p of professionals) {
        const lat = toNumber(p.lat);
        const lng = toNumber(p.lng);

        if (lat !== null && lng !== null) {
          const isAvail = p.is_available ?? p.isAvailable ?? false;
          if (isAvail) availableCount += 1;

          nextPins.push({
            id: `pro-${p.id}`,
            lat,
            lng,
            type: 'professional',
            data: p,
          });
        }
      }

      let inProgressCount = 0;
      const bookingsForMap = bookings.filter(b => Boolean(b.address || (b.lat && b.lng)));

      for (const b of bookingsForMap) {
        if (b.status === 'IN_PROGRESS') inProgressCount += 1;

        let coords: { lat: number; lng: number } | null = null;

        const existingLat = toNumber(b.lat);
        const existingLng = toNumber(b.lng);

        if (existingLat !== null && existingLng !== null) {
          coords = { lat: existingLat, lng: existingLng };
        } else {
          const fullAddress = buildFullAddress(b);
          if (fullAddress) {
            coords = await geocodeAddress(fullAddress);
          }
        }

        if (coords) {
          nextPins.push({
            id: `booking-${b.id}`,
            lat: coords.lat,
            lng: coords.lng,
            type: 'booking',
            data: b,
          });
        }
      }

      setPins(nextPins);
      setStats({
        pros: professionals.length,
        available: availableCount,
        bookings: bookingsForMap.length,
        inProgress: inProgressCount,
      });

      if (!selectedPin) {
        setTimeout(() => fitToPins(nextPins), 0);
      }
    } catch (e) {
      console.error('LiveMap error:', e);
    } finally {
      setLoading(false);
    }
  }, [fitToPins, isLoaded, selectedPin]);

  useEffect(() => {
    if (isLoaded) loadData();
  }, [isLoaded, loadData]);

  useMapRefresh(() => {
    if (isLoaded) loadData();
  }, 30000);

  useEffect(() => {
    if (!selectedPin) {
      fitToPins(filteredPins);
    }
  }, [filteredPins, fitToPins, selectedPin]);

  const renderInfo = () => {
    if (!selectedPin) {
      return (
        <div style={{ padding: 20, color: '#9CA3AF', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
          <p style={{ fontSize: 13 }}>Haz clic en un pin</p>
        </div>
      );
    }

    if (selectedPin.type === 'professional') {
      const p = selectedPin.data as Professional;
      const name = p.full_name || p.fullName || 'Profesional';
      const rate = p.hourly_rate || p.hourlyRate || '—';
      const rating = parseFloat(String(p.avg_rating || p.avgRating || 0)).toFixed(1);
      const services = p.total_services ?? p.totalServices ?? 0;
      const isAvail = p.is_available ?? p.isAvailable ?? false;

      return (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#E6F1FB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              👷
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
              <div style={{ fontSize: 11, color: isAvail ? '#10B981' : '#9CA3AF' }}>
                {isAvail ? '🟢 Disponible' : '⚫ No disponible'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Tarifa', value: `$${rate}/h` },
              { label: 'Rating', value: `⭐ ${rating}` },
              { label: 'Servicios', value: String(services) },
              { label: 'Teléfono', value: p.phone || '—' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ background: '#f5f7fa', borderRadius: 8, padding: '8px 10px' }}
              >
                <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const b = selectedPin.data as Booking;
    const assignedPro = b.professionals?.[0]?.professional?.fullName;
    const fullAddress = buildFullAddress(b) || b.address || 'Sin dirección';

    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: STATUS_COLORS[b.status] || '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'white',
            }}
          >
            🏠
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {b.company?.contactName || b.company?.name || 'Cliente'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: STATUS_COLORS[b.status] || '#9CA3AF',
                fontWeight: 600,
              }}
            >
              {STATUS_LABELS[b.status] || b.status}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => focusPin(selectedPin, 17)}
            style={{
              fontSize: 12,
              color: '#2563EB',
              textDecoration: 'underline',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            title="Centrar este servicio en el mapa"
          >
            📍 {fullAddress}
          </button>

          <div style={{ marginTop: 6 }}>
            <a
              href={googleMapsExternalUrl(selectedPin.lat, selectedPin.lng)}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 11,
                color: '#10B981',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Abrir en Google Maps ↗
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            {
              label: 'Fecha',
              value: b.scheduledAt
                ? new Date(b.scheduledAt).toLocaleDateString('es')
                : '—',
            },
            {
              label: 'Hora',
              value: b.scheduledAt
                ? new Date(b.scheduledAt).toLocaleTimeString('es', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
            },
            { label: 'Sqft', value: b.sqft ? `${b.sqft} ft²` : '—' },
            { label: 'Profesional', value: assignedPro || 'Sin asignar' },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{ background: '#f5f7fa', borderRadius: 8, padding: '8px 10px' }}
            >
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {b.status === 'PENDING_ASSIGNMENT' && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 8,
              fontSize: 12,
              color: '#92400E',
            }}
          >
            ⏳ En espera de asignación
          </div>
        )}
      </div>
    );
  };

  const legend = [
    { color: '#10B981', label: 'Pro disponible' },
    { color: '#6B7280', label: 'Pro ocupado' },
    { color: '#F59E0B', label: 'Pendiente' },
    { color: '#3B82F6', label: 'Confirmado' },
    { color: '#8B5CF6', label: 'En curso' },
    { color: '#10B981', label: 'Completado' },
    { color: '#EF4444', label: 'Cancelado' },
  ];

  if (loadError) {
    return (
      <div
        style={{
          height: 760,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          color: '#EF4444',
          fontSize: 14,
        }}
      >
        Error cargando Google Maps
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div
        style={{
          height: 760,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          color: '#92400E',
          fontSize: 14,
          textAlign: 'center',
          padding: 24,
        }}
      >
        Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {[
          { label: 'Profesionales', value: stats.pros, icon: '👷', color: '#E6F1FB' },
          { label: 'Disponibles', value: stats.available, icon: '🟢', color: '#D1FAE5' },
          { label: 'Servicios en mapa', value: stats.bookings, icon: '📍', color: '#EDE9FE' },
          { label: 'En curso', value: stats.inProgress, icon: '⚡', color: '#FEF3C7' },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            style={{
              background: color,
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                {loading ? '…' : value}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            position: 'relative',
            minHeight: 680,
            background: '#f3f4f6',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 10,
              display: 'flex',
              gap: 6,
            }}
          >
            {(['all', 'professional', 'booking'] as const).map(t => (
              <button
                key={t}
                onClick={() => {
                  setSelectedPin(null);
                  setFilterType(t);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: 'none',
                  background: filterType === t ? '#10B981' : 'white',
                  color: filterType === t ? 'white' : '#374151',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {t === 'all' ? 'Todos' : t === 'professional' ? '👷 Pros' : '🏠 Servicios'}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: 'white',
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
            title="Actualizar"
          >
            🔄
          </button>

          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 9,
                background: 'rgba(255,255,255,0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ⟳ Cargando mapa…
            </div>
          )}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={DEFAULT_CENTER}
              zoom={8}
              onLoad={map => {
                mapRef.current = map;
              }}
              options={{
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                clickableIcons: false,
              }}
            >
              {filteredPins.map(pin => {
                const isPro = pin.type === 'professional';
                const pro = pin.data as Professional;
                const booking = pin.data as Booking;
                const isAvail = isPro ? (pro.is_available ?? pro.isAvailable ?? false) : false;

                const color = isPro
                  ? isAvail
                    ? '#10B981'
                    : '#6B7280'
                  : STATUS_COLORS[booking.status] || '#6B7280';

                const isSelected = selectedPin?.id === pin.id;

                return (
                  <MarkerF
                    key={pin.id}
                    position={{ lat: pin.lat, lng: pin.lng }}
                    onClick={() => {
                      setSelectedPin(pin);
                      focusPin(pin, 15);
                    }}
                    label={
                      {
                        text: isPro ? 'P' : 'S',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '10px',
                      } as any
                    }
                    icon={{
                      path: (window as any).google.maps.SymbolPath.CIRCLE,
                      fillColor: color,
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                      scale: isSelected ? 12 : 10,
                    }}
                  />
                );
              })}
            </GoogleMap>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              zIndex: 10,
              background: 'white',
              borderRadius: 10,
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {legend.map(({ color, label }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  color: '#374151',
                  marginBottom: 3,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: 300,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 12,
              fontWeight: 700,
              color: '#10B981',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {selectedPin ? 'Detalle del pin' : 'Información'}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 680 }}>{renderInfo()}</div>

          {selectedPin && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setSelectedPin(null)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: '#f3f4f6',
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: 12,
                }}
              >
                ✕ Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
