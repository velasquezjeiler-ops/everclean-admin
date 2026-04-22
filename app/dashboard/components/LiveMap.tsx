'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useMapRefresh } from './useMapRefresh';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

type Professional = {
  id: string;
  full_name?: string;
  fullName?: string;
  lat?: string | number | null;
  lng?: string | number | null;
  is_available?: boolean;
  isAvailable?: boolean;
  phone?: string;
};

type Booking = {
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
};

type PinItem = {
  id: string;
  lat: number;
  lng: number;
  type: 'professional' | 'booking';
  data: Professional | Booking;
};

const DEFAULT_CENTER = { lat: 40.7357, lng: -74.1724 };

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

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function buildFullAddress(b: Booking) {
  return [b.address, b.city, b.state, b.zip].filter(Boolean).join(', ');
}

function openGoogleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function openStreetViewUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function getMarkerIcon(pin: PinItem, selected: boolean): google.maps.Symbol {
  const isBooking = pin.type === 'booking';
  const booking = pin.data as Booking;
  const professional = pin.data as Professional;

  const baseColor = isBooking
    ? STATUS_COLORS[booking.status] || '#6B7280'
    : ((professional.is_available ?? professional.isAvailable) ? '#10B981' : '#4B5563');

  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: baseColor,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeOpacity: 1,
    strokeWeight: selected ? 5 : 4,
    scale: selected ? 16 : 14,
  };
}

function getMarkerLabel(pin: PinItem): google.maps.MarkerLabel | undefined {
  if (pin.type === 'professional') {
    return {
      text: 'P',
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: '14px',
    };
  }

  return {
    text: 'S',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: '14px',
  };
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const streetViewContainerRef = useRef<HTMLDivElement | null>(null);
  const streetViewPanoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<PinItem[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [streetViewAvailable, setStreetViewAvailable] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'professional' | 'booking'>('all');
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

  const mapOptions: google.maps.MapOptions = {
    gestureHandling: 'greedy',
    scrollwheel: true,
    clickableIcons: false,
    streetViewControl: true,
    mapTypeControl: true,
    fullscreenControl: true,
    zoomControl: true,
  };

  const filteredPins = useMemo(
    () => pins.filter(pin => filterType === 'all' || pin.type === filterType),
    [pins, filterType]
  );

  const fitToPins = useCallback((items: PinItem[]) => {
    if (!mapRef.current || !(window as any).google || items.length === 0) return;

    if (items.length === 1) {
      mapRef.current.panTo({ lat: items[0].lat, lng: items[0].lng });
      mapRef.current.setZoom(14);
      return;
    }

    const bounds = new (window as any).google.maps.LatLngBounds();
    items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
    mapRef.current.fitBounds(bounds);
  }, []);

  const focusPin = useCallback((pin: PinItem | null, zoom = 17) => {
    if (!pin || !mapRef.current) return;
    mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
    mapRef.current.setZoom(zoom);
  }, []);

  const handleWheelZoom = useCallback((event: WheelEvent) => {
    if (!mapRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const currentZoom = mapRef.current.getZoom() ?? 11;
    const direction = event.deltaY < 0 ? 1 : -1;
    const step = Math.abs(event.deltaY) > 40 ? 2 : 1;
    const nextZoom = currentZoom + direction * step;
    const boundedZoom = Math.max(4, Math.min(20, nextZoom));

    mapRef.current.setZoom(boundedZoom);
  }, []);

  const loadStreetView = useCallback((lat: number, lng: number) => {
    if (!(window as any).google || !streetViewContainerRef.current) return;

    const googleRef = (window as any).google;
    const sv = new googleRef.maps.StreetViewService();

    sv.getPanorama(
      {
        location: { lat, lng },
        radius: 80,
        source: googleRef.maps.StreetViewSource.OUTDOOR,
      },
      (data: any, status: string) => {
        if (status === 'OK' && data?.location?.latLng) {
          setStreetViewAvailable(true);

          streetViewPanoramaRef.current = new googleRef.maps.StreetViewPanorama(
            streetViewContainerRef.current!,
            {
              position: data.location.latLng,
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
              addressControl: false,
              fullscreenControl: false,
              motionTracking: false,
              linksControl: true,
              panControl: true,
              enableCloseButton: false,
            }
          );
        } else {
          setStreetViewAvailable(false);
          if (streetViewContainerRef.current) {
            streetViewContainerRef.current.innerHTML = '';
          }
        }
      }
    );
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

      const prosJson = await prosRes.json();
      const bookingsJson = await bookingsRes.json();

      const professionals: Professional[] = Array.isArray(prosJson) ? prosJson : prosJson.data || [];
      const bookings: Booking[] = Array.isArray(bookingsJson)
        ? bookingsJson
        : bookingsJson.data || [];

      const nextPins: PinItem[] = [];
      let available = 0;
      let inProgress = 0;

      for (const pro of professionals) {
        const lat = toNumber(pro.lat);
        const lng = toNumber(pro.lng);

        if (lat !== null && lng !== null) {
          const isAvail = pro.is_available ?? pro.isAvailable ?? false;
          if (isAvail) available += 1;

          nextPins.push({
            id: `pro-${pro.id}`,
            lat,
            lng,
            type: 'professional',
            data: pro,
          });
        }
      }

      const bookingsForMap = bookings.filter(b => Boolean(buildFullAddress(b) || (b.lat && b.lng)));

      for (const booking of bookingsForMap) {
        if (booking.status === 'IN_PROGRESS') inProgress += 1;

        let coords: { lat: number; lng: number } | null = null;

        const lat = toNumber(booking.lat);
        const lng = toNumber(booking.lng);

        if (lat !== null && lng !== null) {
          coords = { lat, lng };
        } else {
          const address = buildFullAddress(booking);
          if (address) coords = await geocodeAddress(address);
        }

        if (coords) {
          nextPins.push({
            id: `booking-${booking.id}`,
            lat: coords.lat,
            lng: coords.lng,
            type: 'booking',
            data: booking,
          });
        }
      }

      console.log('LIVE_MAP_DEBUG', {
        professionals: professionals.length,
        bookings: bookings.length,
        bookingsForMap: bookingsForMap.length,
        pinsBuilt: nextPins.length,
        bookingPins: nextPins.filter(pin => pin.type === 'booking').length,
        professionalPins: nextPins.filter(pin => pin.type === 'professional').length,
      });

      setPins(nextPins);
      setStats({
        pros: professionals.length,
        available,
        bookings: bookingsForMap.length,
        inProgress,
      });

      if (!selectedPin) {
        setTimeout(() => fitToPins(nextPins), 0);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
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

  useEffect(() => {
    const wrapper = mapWrapperRef.current;
    if (!wrapper) return;

    wrapper.addEventListener('wheel', handleWheelZoom, { passive: false });

    return () => {
      wrapper.removeEventListener('wheel', handleWheelZoom);
    };
  }, [handleWheelZoom]);


  useEffect(() => {
    if (!selectedPin || selectedPin.type !== 'booking') {
      setStreetViewAvailable(false);
      if (streetViewContainerRef.current) {
        streetViewContainerRef.current.innerHTML = '';
      }
      return;
    }

    loadStreetView(selectedPin.lat, selectedPin.lng);
  }, [selectedPin, loadStreetView]);


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
        }}
      >
        Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

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
      const isAvail = p.is_available ?? p.isAvailable ?? false;

      return (
        <div style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 12, color: isAvail ? '#10B981' : '#6B7280', marginBottom: 10 }}>
            {isAvail ? 'Disponible' : 'No disponible'}
          </div>
          <div style={{ fontSize: 12, color: '#374151' }}>{p.phone || 'Sin teléfono'}</div>
        </div>
      );
    }

    const b = selectedPin.data as Booking;
    const fullAddress = buildFullAddress(b) || 'Sin dirección';
    const assignedPro = b.professionals?.[0]?.professional?.fullName || 'Sin asignar';

    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
          {b.company?.contactName || b.company?.name || 'Cliente'}
        </div>
        <div
          style={{
            fontSize: 12,
            color: STATUS_COLORS[b.status] || '#6B7280',
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          {STATUS_LABELS[b.status] || b.status}
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#374151' }}>
            <strong>Direccion:</strong> {fullAddress}
          </div>
          <div style={{ fontSize: 12, color: '#374151' }}>
            <strong>Fecha:</strong>{' '}
            {b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('es-US') : '—'}
          </div>
          <div style={{ fontSize: 12, color: '#374151' }}>
            <strong>Hora:</strong>{' '}
            {b.scheduledAt
              ? new Date(b.scheduledAt).toLocaleTimeString('es-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </div>
          <div style={{ fontSize: 12, color: '#374151' }}>
            <strong>Sqft:</strong> {b.sqft ? `${b.sqft} ft²` : '—'}
          </div>
          <div style={{ fontSize: 12, color: '#374151' }}>
            <strong>Profesional:</strong> {assignedPro}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => focusPin(selectedPin, 18)}
            style={{
              border: 'none',
              borderRadius: 10,
              padding: '10px 12px',
              background: '#10B981',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Centrar en mapa
          </button>

          <a
            href={openGoogleMapsUrl(selectedPin.lat, selectedPin.lng)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '10px 12px',
              background: '#E5F0FF',
              color: '#1D4ED8',
              fontWeight: 700,
            }}
          >
            Abrir en Google Maps
          </a>

          <a
            href={openStreetViewUrl(selectedPin.lat, selectedPin.lng)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '10px 12px',
              background: '#F3E8FF',
              color: '#7C3AED',
              fontWeight: 700,
            }}
          >
            Abrir Street View
          </a>
        </div>

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#6B7280',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Vista de calle
          </div>

          <div
            ref={streetViewContainerRef}
            style={{
              width: '100%',
              height: 220,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
            }}
          />

          {!streetViewAvailable && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: '#6B7280',
              }}
            >
              No se encontro Street View cercano para esta ubicacion.
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <a
            href={openGoogleMapsUrl(selectedPin.lat, selectedPin.lng)}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: '#10B981', fontWeight: 700, textDecoration: 'none' }}
          >
            Abrir en Google Maps ↗
          </a>
        </div>

        <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
          <div>Fecha: {b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('es') : '—'}</div>
          <div>
            Hora:{' '}
            {b.scheduledAt
              ? new Date(b.scheduledAt).toLocaleTimeString('es', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </div>
          <div>Sqft: {b.sqft ? `${b.sqft} ft²` : '—'}</div>
          <div>Profesional: {assignedPro}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        {[
          { label: 'Profesionales', value: stats.pros, icon: '👷', color: '#E6F1FB' },
          { label: 'Disponibles', value: stats.available, icon: '🟢', color: '#D1FAE5' },
          { label: 'Servicios en mapa', value: stats.bookings, icon: '📍', color: '#EDE9FE' },
          { label: 'En curso', value: stats.inProgress, icon: '⚡', color: '#FEF3C7' },
        ].map(card => (
          <div
            key={card.label}
            style={{
              background: card.color,
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>{card.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                {loading ? '…' : card.value}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{card.label}</div>
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
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 6 }}>
            {(['all', 'professional', 'booking'] as const).map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedPin(null);
                  setFilterType(type);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: 'none',
                  background: filterType === type ? '#10B981' : 'white',
                  color: filterType === type ? 'white' : '#374151',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {type === 'all' ? 'Todos' : type === 'professional' ? '👷 Pros' : '🏠 Servicios'}
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
                const isProfessional = pin.type === 'professional';
                const pro = pin.data as Professional;
                const booking = pin.data as Booking;
                const isAvail = isProfessional ? (pro.is_available ?? pro.isAvailable ?? false) : false;

                const color = isProfessional
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
                    label={{
                      text: isProfessional ? 'P' : 'S',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '10px',
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
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
