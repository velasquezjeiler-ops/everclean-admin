'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import MapSection from '../components/MapSection';

const SC: Record<string, string> = {
  PENDING_ASSIGNMENT: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-purple-50 text-purple-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700'
};

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    api.bookings.list(token).then(data => {
      setBookings(data.data || []);
      setTotal(data.total || 0);
      setLoading(false);
    });
    api.professionals.list(token).then(data => {
      setProfessionals(data.data || []);
    });
  }, []);

  async function assignProfessional(bookingId: string, professionalId: string) {
    setAssigning(bookingId);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + bookingId + '/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ professionalId })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b));
        setSelected((prev: any) => prev ? { ...prev, status: 'CONFIRMED' } : null);
      }
    } catch(e) {}
    setAssigning(null);
  }

  async function updateStatus(bookingId: string, status: string) {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(API + '/bookings/' + bookingId + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
        setSelected((prev: any) => prev ? { ...prev, status } : null);
      }
    } catch(e) {}
  }

  if (selected) {
    const pros = professionals.filter((p: any) => p.isAvailable);
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-sm text-gray-500 mb-6 hover:text-gray-700">← Volver a bookings</button>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900 mb-4">Asignar profesional</h1>
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">{selected.serviceType?.replace(/_/g, ' ')}</p>
              <p className="text-xs text-gray-400">{selected.address}, {selected.city}</p>
              <p className="text-xs text-gray-400">{new Date(selected.scheduledAt).toLocaleString()}</p>
              <p className="text-xs text-gray-400">{selected.sqft} sqft</p>
              {selected.clientNotes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">{selected.clientNotes}</p>}
            </div>
            <div className="space-y-3">
              {pros.length === 0
                ? <p className="text-gray-400 text-sm">No hay profesionales disponibles</p>
                : pros.map((pro: any) => (
                <div key={pro.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm flex-shrink-0">
                    {pro.fullName.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{pro.fullName}</p>
                    <p className="text-xs text-gray-400">Radio: {pro.serviceRadiusMiles}mi · Rating: {Number(pro.avgRating).toFixed(1)} · {pro.totalServices} servicios</p>
                  </div>
                  <button onClick={() => assignProfessional(selected.id, pro.id)} disabled={assigning === selected.id}
                    className="bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-800 disabled:opacity-50">
                    {assigning === selected.id ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-4">Cambiar estado</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {['PENDING_ASSIGNMENT','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(status => (
                <button key={status} onClick={() => updateStatus(selected.id, status)}
                  className={"w-full text-left px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between " + (selected.status === status ? 'bg-emerald-50' : '')}>
                  <span>{status.replace(/_/g, ' ')}</span>
                  {selected.status === status && <span className="text-emerald-600 text-xs">● Actual</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-medium text-gray-900 mb-6">Bookings ({total})</h1>
      <MapSection />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Servicio</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Empresa</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Total</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Profesional</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Acción</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            : bookings.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin bookings</td></tr>
            : bookings.map((b: any) => (
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{b.serviceType?.replace(/_/g, ' ')}</p>
                  <p className="text-gray-400 text-xs">{b.frequency}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{b.company?.name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(b.scheduledAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{b.totalAmount ? '$' + b.totalAmount : '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {b.professionals?.length > 0
                    ? b.professionals[0]?.professional?.fullName || 'Asignado'
                    : <span className="text-amber-500 text-xs">Sin asignar</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={"text-xs px-2 py-0.5 rounded-full " + (SC[b.status] || 'bg-gray-50 text-gray-600')}>
                    {b.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(b)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg">
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
