'use client';
import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

const STATUS_COLOR: Record<string, string> = {
  PENDING_ASSIGNMENT: '#f59e0b',
  CONFIRMED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_ASSIGNMENT: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function MapPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [bRes, pRes] = await Promise.all([
        fetch(API + '/bookings?limit=50', { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API + '/professionals', { headers: { Authorization: 'Bearer ' + token } }),
      ]);
      const [b, p] = await Promise.all([bRes.json(), pRes.json()]);
      setBookings(b.data || b || []);
      setPros(p.data || p || []);
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh cada 30s
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Cargar Google Maps dinámicamente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).google?.maps) { setMapLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBpnkZWe98km0RDpg6Zjq6_VQlFCv-lfCE&libraries=marker`;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || loading) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    const existingMap = (window as any)._evercleanMap;

    let gmap = existingMap;
    if (!gmap) {
      gmap = new google.maps.Map(document.getElementById('map-container'), {
        center: { lat: 40.7357, lng: -74.1724 },
        zoom: 11,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
        mapTypeControl: false,
        streetViewControl: false,
      });
      (window as any)._evercleanMap = gmap;
    } else {
      // Limpiar markers anteriores
      ((window as any)._evercleanMarkers || []).forEach((m: any) => m.setMap(null));
    }
    (window as any)._evercleanMarkers = [];

    const infoWindow = new google.maps.InfoWindow();

    // Marcadores de bookings activos
    bookings
      .filter(b => ['PENDING_ASSIGNMENT','CONFIRMED','IN_PROGRESS'].includes(b.status))
      .forEach(b => {
        if (!b.lat && !b.lng) return;
        const color = STATUS_COLOR[b.status] || '#6b7280';
        const emoji = b.status === 'IN_PROGRESS' ? '🧹' : b.status === 'CONFIRMED' ? '✅' : '🏠';
        const marker = new google.maps.Marker({
          position: { lat: Number(b.lat), lng: Number(b.lng) },
          map: gmap,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="${encodeURIComponent(color)}" stroke="white" stroke-width="3"/><text x="20" y="26" text-anchor="middle" font-size="18">${emoji}</text></svg>`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          },
          title: b.serviceType,
        });
        marker.addListener('click', () => {
          infoWindow.setContent(`<div style="min-width:200px;padding:4px">
            <p style="font-weight:600;margin:0 0 4px">${b.serviceType?.replace(/_/g,' ')}</p>
            <p style="color:#6b7280;font-size:12px;margin:0 0 8px">${b.address}, ${b.city}</p>
            <span style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:11px">${STATUS_LABEL[b.status]}</span>
            ${b.totalAmount ? `<p style="color:#065f46;font-weight:700;margin:8px 0 0">${b.totalAmount}</p>` : ''}
          </div>`);
          infoWindow.open(gmap, marker);
        });
        (window as any)._evercleanMarkers.push(marker);
      });

    // Marcadores de profesionales
    pros.forEach(p => {
      if (!p.lat && !p.lng) return;
      const isActive = bookings.some(b => b.status === 'IN_PROGRESS' && b.professionals?.some((bp: any) => bp.professionalId === p.id));
      const marker = new google.maps.Marker({
        position: { lat: Number(p.lat), lng: Number(p.lng) },
        map: gmap,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="${isActive ? '%238b5cf6' : '%2310b981'}" stroke="white" stroke-width="3"/><text x="22" y="29" text-anchor="middle" font-size="20">${isActive ? '🧹' : '👷'}</text></svg>`,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        title: p.fullName || p.full_name,
      });
      marker.addListener('click', () => {
        infoWindow.setContent(`<div style="min-width:180px;padding:4px">
          <p style="font-weight:600;margin:0 0 4px">${p.fullName || p.full_name}</p>
          <p style="color:#6b7280;font-size:12px;margin:0 0 6px">⭐ ${Number(p.avgRating || p.avg_rating || 0).toFixed(1)} · ${p.totalServices || p.total_services || 0} services</p>
          <span style="background:${isActive ? '#8b5cf6' : '#10b981'};color:white;padding:2px 8px;border-radius:12px;font-size:11px">${isActive ? 'In Service' : 'Available'}</span>
        </div>`);
        infoWindow.open(gmap, marker);
      });
      (window as any)._evercleanMarkers.push(marker);
    });

  }, [mapLoaded, bookings, pros, loading]);

  const active = bookings.filter(b => b.status === 'IN_PROGRESS');
  const pending = bookings.filter(b => b.status === 'PENDING_ASSIGNMENT');
  const available = pros.filter(p => p.isAvailable || p.is_available);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Live Map</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> {active.length} In progress</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> {pending.length} Pending</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> {available.length} Available pros</span>
          </div>
          <button onClick={load} className="text-xs text-emerald-700 font-medium px-3 py-1.5 bg-emerald-50 rounded-lg">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div id="map-container" className="flex-1 rounded-2xl overflow-hidden border border-gray-200" style={{ minHeight: '600px' }}>
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Auto-refreshes every 30 seconds · Showing active bookings and professionals in NJ
      </p>
    </div>
  );
}
