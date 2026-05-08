'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useTranslation } from '../../../lib/i18n/useTranslation';
import { getApiBase } from '../../../lib/apiBase';
import { useMapRefresh } from './useMapRefresh';

type Professional = {
  id: string;
  full_name?: string;
  fullName?: string;
  phone?: string;
  city?: string;
  state?: string;
  lat?: string | number | null;
  lng?: string | number | null;
  is_available?: boolean;
  isAvailable?: boolean;
};

type Booking = {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  status: string;
  scheduled_at?: string;
  scheduledAt?: string;
  sqft?: number;
  service_type?: string;
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
const C = { navy:'#0D3781', green:'#4CAF50', ink:'#0D1B2A', muted:'#64748B', border:'#E2E8F0', soft:'#F8FAFC' };

const STATUS_COLORS: Record<string, string> = {
  PENDING_ASSIGNMENT: '#F59E0B',
  CONFIRMED: '#1D4ED8',
  IN_PROGRESS: '#6D28D9',
  COMPLETED: '#047857',
  CANCELLED: '#B91C1C',
};

const geocodeCache: Record<string, { lat: number; lng: number }> = {};

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function buildAddress(booking: Booking) {
  return [booking.address, booking.city, booking.state, booking.zip].filter(Boolean).join(', ');
}

function serviceLabel(value?: string) {
  return (value || 'Service').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function mapsUrl(lat: number, lng: number) {
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
        return;
      }
      resolve(null);
    });
  });
}

export default function LiveMap() {
  const { t } = useTranslation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<PinItem[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'professional' | 'booking'>('all');
  const [stats, setStats] = useState({ pros: 0, available: 0, bookings: 0, inProgress: 0 });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'everclean-google-map',
    googleMapsApiKey: apiKey,
  });

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

  const focusPin = useCallback((pin: PinItem | null, zoom = 15) => {
    if (!pin || !mapRef.current) return;
    mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
    mapRef.current.setZoom(zoom);
  }, []);

  const zoomIn = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(Math.min(20, (mapRef.current.getZoom() || 10) + 1));
  }, []);

  const zoomOut = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(Math.max(4, (mapRef.current.getZoom() || 10) - 1));
  }, []);

  const loadData = useCallback(async () => {
    if (!isLoaded || !(window as any).google) return;
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);
      const [prosRes, bookingsRes] = await Promise.all([
        fetch(`${getApiBase()}/professionals`, { headers }),
        fetch(`${getApiBase()}/bookings?limit=500`, { headers }),
      ]);
      const [prosJson, bookingsJson] = await Promise.all([prosRes.json(), bookingsRes.json()]);
      const professionals: Professional[] = Array.isArray(prosJson) ? prosJson : prosJson.data || [];
      const bookings: Booking[] = Array.isArray(bookingsJson) ? bookingsJson : bookingsJson.data || [];
      const nextPins: PinItem[] = [];
      let available = 0;
      let inProgress = 0;
      let mappedBookings = 0;

      for (const pro of professionals) {
        const lat = toNumber(pro.lat);
        const lng = toNumber(pro.lng);
        if (lat === null || lng === null) continue;
        if (pro.is_available ?? pro.isAvailable) available += 1;
        nextPins.push({ id: `pro-${pro.id}`, lat, lng, type: 'professional', data: pro });
      }

      for (const booking of bookings) {
        if (booking.status === 'IN_PROGRESS') inProgress += 1;
        let coords: { lat: number; lng: number } | null = null;
        const lat = toNumber(booking.lat);
        const lng = toNumber(booking.lng);
        if (lat !== null && lng !== null) coords = { lat, lng };
        else coords = await geocodeAddress(buildAddress(booking));
        if (!coords) continue;
        mappedBookings += 1;
        nextPins.push({ id: `booking-${booking.id}`, lat: coords.lat, lng: coords.lng, type: 'booking', data: booking });
      }

      setPins(nextPins);
      setStats({ pros: professionals.length, available, bookings: mappedBookings, inProgress });
      if (!selectedPin) window.setTimeout(() => fitToPins(nextPins), 0);
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  }, [fitToPins, isLoaded, selectedPin]);

  useEffect(() => { if (isLoaded) loadData(); }, [isLoaded, loadData]);
  useMapRefresh(() => { if (isLoaded) loadData(); }, 30000);
  useEffect(() => { if (!selectedPin) fitToPins(filteredPins); }, [filteredPins, fitToPins, selectedPin]);

  if (loadError) {
    return <div style={emptyState}>Error loading Google Maps</div>;
  }

  if (!apiKey) {
    return (
      <div style={emptyState}>
        <div>
          <h3 style={{ margin: '0 0 8px', color: C.ink }}>Mapa no configurado</h3>
          <p style={{ margin: 0, color: C.muted }}>Agrega NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en Vercel y redeploy.</p>
        </div>
      </div>
    );
  }

  const legendItems = [
    { color: '#10B981', label: t('map.proAvailable'), badge: 'P' },
    { color: '#4B5563', label: t('map.proUnavailable'), badge: 'P' },
    { color: STATUS_COLORS.PENDING_ASSIGNMENT, label: t('map.servicePending'), badge: 'S' },
    { color: STATUS_COLORS.CONFIRMED, label: t('map.serviceConfirmed'), badge: 'S' },
    { color: STATUS_COLORS.IN_PROGRESS, label: t('map.serviceInProgress'), badge: 'S' },
    { color: STATUS_COLORS.COMPLETED, label: t('map.serviceCompleted'), badge: 'S' },
    { color: STATUS_COLORS.CANCELLED, label: t('map.serviceCancelled'), badge: 'S' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .admin-map-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .admin-map-grid { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 12px; flex: 1; min-height: 0; }
        @media (max-width: 1100px) {
          .admin-map-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .admin-map-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-map-stats">
        {[
          { label: t('admin.map.professionals'), value: stats.pros, mark: 'PR', bg: '#E6F1FB', color: C.navy },
          { label: t('admin.map.availableCount'), value: stats.available, mark: 'AV', bg: '#D1FAE5', color: '#047857' },
          { label: t('admin.map.servicesOnMap'), value: stats.bookings, mark: 'SV', bg: '#EDE9FE', color: '#6D28D9' },
          { label: t('admin.map.inProgress'), value: stats.inProgress, mark: 'IP', bg: '#FEF3C7', color: '#92400E' },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, minHeight: 64 }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', color: card.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, boxShadow: '0 2px 8px rgba(13,55,129,0.06)' }}>{card.mark}</span>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: C.ink }}>{loading ? '...' : card.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-map-grid">
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, position: 'relative', minHeight: 640, background: '#f3f4f6' }}>
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 6 }}>
            {(['all', 'professional', 'booking'] as const).map(type => (
              <button key={type} onClick={() => { setSelectedPin(null); setFilterType(type); }} style={{ padding: '7px 12px', borderRadius: 9999, border: '1px solid rgba(13,55,129,0.12)', background: filterType === type ? C.green : '#fff', color: filterType === type ? '#fff' : C.ink, fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(13,55,129,0.10)' }}>
                {type === 'all' ? t('map.allPins') : type === 'professional' ? t('map.prosOnly') : t('map.servicesOnly')}
              </button>
            ))}
          </div>

          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 6 }}>
            <button onClick={zoomIn} title={t('map.zoomIn')} style={toolButton}>+</button>
            <button onClick={zoomOut} title={t('map.zoomOut')} style={toolButton}>-</button>
            <button onClick={() => fitToPins(filteredPins)} title={t('map.reset')} style={{ ...toolButton, width: 58 }}>Reset</button>
            <button onClick={loadData} title={t('common.refresh')} style={toolButton}>R</button>
          </div>

          {loading && <div style={loadingOverlay}>Loading map...</div>}

          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={DEFAULT_CENTER}
              zoom={8}
              onLoad={map => { mapRef.current = map; }}
              options={{ gestureHandling: 'greedy', scrollwheel: true, zoomControl: true, fullscreenControl: true, streetViewControl: false, mapTypeControl: false, clickableIcons: false }}
            >
              {filteredPins.map(pin => {
                const isProfessional = pin.type === 'professional';
                const professional = pin.data as Professional;
                const booking = pin.data as Booking;
                const isAvailable = professional.is_available ?? professional.isAvailable ?? false;
                const color = isProfessional ? (isAvailable ? '#10B981' : '#4B5563') : (STATUS_COLORS[booking.status] || '#6B7280');
                const selected = selectedPin?.id === pin.id;
                return (
                  <MarkerF
                    key={pin.id}
                    position={{ lat: pin.lat, lng: pin.lng }}
                    onClick={() => { setSelectedPin(pin); focusPin(pin, 15); }}
                    label={{ text: isProfessional ? 'P' : 'S', color: '#fff', fontWeight: '800', fontSize: '10px' }}
                    icon={{ path: google.maps.SymbolPath.CIRCLE, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: selected ? 12 : 10 }}
                  />
                );
              })}
            </GoogleMap>
          )}
        </div>

        <aside style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 800, color: C.green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {selectedPin ? t('map.pinDetail') : t('map.information')}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 660 }}>
            <PinDetails pin={selectedPin} focusPin={focusPin} />
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '14px 16px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('map.legend')}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {legendItems.map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.ink, fontWeight: 600 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: item.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{item.badge}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PinDetails({ pin, focusPin }: { pin: PinItem | null; focusPin: (pin: PinItem | null, zoom?: number) => void }) {
  const { t } = useTranslation();
  if (!pin) {
    return <div style={{ padding: 28, color: C.muted, textAlign: 'center', fontSize: 13 }}>{t('map.clickPin')}</div>;
  }

  if (pin.type === 'professional') {
    const pro = pin.data as Professional;
    const name = pro.full_name || pro.fullName || t('map.professional');
    const isAvailable = pro.is_available ?? pro.isAvailable ?? false;
    return (
      <div style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, color: C.ink }}>{name}</h3>
        <span style={{ display: 'inline-flex', borderRadius: 9999, padding: '5px 10px', background: isAvailable ? '#D1FAE5' : '#F1F5F9', color: isAvailable ? '#065F46' : C.muted, fontSize: 11, fontWeight: 700 }}>{isAvailable ? t('map.availablePro') : t('map.unavailablePro')}</span>
        <p style={{ margin: '12px 0 0', color: C.muted, fontSize: 12 }}>{pro.phone || '-'}</p>
      </div>
    );
  }

  const booking = pin.data as Booking;
  const address = buildAddress(booking) || '-';
  const assignedPro = booking.professionals?.[0]?.professional?.fullName || '-';
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 15, color: C.ink }}>{serviceLabel(booking.service_type)}</h3>
      <span style={{ display: 'inline-flex', borderRadius: 9999, padding: '5px 10px', background: '#EAF4FF', color: C.navy, fontSize: 11, fontWeight: 700 }}>{booking.status}</span>
      <div style={{ display: 'grid', gap: 8, marginTop: 14, fontSize: 12, color: '#374151' }}>
        <div><strong>{t('map.direction')}:</strong> {address}</div>
        <div><strong>{t('map.date')}:</strong> {booking.scheduled_at || booking.scheduledAt ? new Date(booking.scheduled_at || booking.scheduledAt || '').toLocaleDateString() : '-'}</div>
        <div><strong>{t('map.sqft')}:</strong> {booking.sqft || '-'}</div>
        <div><strong>{t('map.professional')}:</strong> {assignedPro}</div>
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
        <button onClick={() => focusPin(pin, 18)} style={primaryAction}>{t('map.centerOnMap')}</button>
        <a href={mapsUrl(pin.lat, pin.lng)} target="_blank" rel="noreferrer" style={secondaryAction}>{t('map.openGoogleMaps')}</a>
      </div>
    </div>
  );
}

const emptyState = {
  height: 760,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #E2E8F0',
  color: '#64748B',
  fontSize: 14,
};

const loadingOverlay = {
  position: 'absolute' as const,
  inset: 0,
  zIndex: 9,
  background: 'rgba(255,255,255,0.72)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  color: C.muted,
};

const toolButton = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: '1px solid rgba(13,55,129,0.12)',
  background: '#fff',
  color: C.ink,
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: '0 6px 18px rgba(13,55,129,0.12)',
};

const primaryAction = {
  border: 0,
  borderRadius: 10,
  padding: '10px 12px',
  background: C.green,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryAction = {
  display: 'block',
  textAlign: 'center' as const,
  textDecoration: 'none',
  borderRadius: 10,
  padding: '10px 12px',
  background: '#EAF4FF',
  color: C.navy,
  fontWeight: 700,
};
