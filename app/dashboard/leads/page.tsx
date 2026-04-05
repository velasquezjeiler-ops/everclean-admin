'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    api.leads.list(token).then(data => {
      setLeads(data.data || []);
      setTotal(data.total || 0);
      setLoading(false);
    });
  }, []);

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className='text-sm text-gray-500 mb-6 hover:text-gray-700 flex items-center gap-1'>← Volver a leads</button>
        <div className='grid grid-cols-2 gap-6'>
          <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
            {selected.googlePhotoUrl ? (
              <img src={selected.googlePhotoUrl} alt={selected.companyName} className='w-full h-48 object-cover' />
            ) : (
              <div className='w-full h-48 bg-emerald-50 flex items-center justify-center text-emerald-300 text-4xl font-light'>
                {selected.companyName?.[0] || '?'}
              </div>
            )}
            <div className='p-5'>
              <h2 className='text-lg font-medium text-gray-900 mb-1'>{selected.companyName || 'Sin empresa'}</h2>
              {selected.googleAddress && <p className='text-sm text-gray-500 mb-3'>{selected.googleAddress}</p>}
              {selected.googleRating && (
                <div className='flex items-center gap-2 mb-3'>
                  <span className='text-amber-400 font-medium'>★ {selected.googleRating}</span>
                  <span className='text-sm text-gray-400'>({selected.googleReviewCount} reseñas Google)</span>
                </div>
              )}
              {selected.googleHours && <p className='text-xs text-gray-400 mb-3'>{selected.googleHours}</p>}
              {selected.enrichedAt && (
                <span className='text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full'>Enriquecido con Google Places</span>
              )}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='bg-white rounded-xl border border-gray-200 p-5'>
              <h3 className='text-sm font-medium text-gray-700 mb-3'>Datos del contacto</h3>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'><span className='text-gray-500'>Nombre</span><span className='font-medium'>{selected.contactName}</span></div>
                <div className='flex justify-between'><span className='text-gray-500'>Email</span><span className='text-blue-600'>{selected.contactEmail}</span></div>
                <div className='flex justify-between'><span className='text-gray-500'>Teléfono</span><span>{selected.contactPhone || '-'}</span></div>
                <div className='flex justify-between'><span className='text-gray-500'>Canal</span><span>{selected.sourceChannel}</span></div>
                <div className='flex justify-between'><span className='text-gray-500'>Estado</span><span className='bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full'>{selected.status}</span></div>
                <div className='flex justify-between'><span className='text-gray-500'>Fecha</span><span>{new Date(selected.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
            <div className='bg-white rounded-xl border border-gray-200 p-5'>
              <h3 className='text-sm font-medium text-gray-700 mb-3'>Acciones</h3>
              <div className='space-y-2'>
                <button className='w-full bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-800'>Crear booking</button>
                <button className='w-full border border-gray-200 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50'>Marcar como contactado</button>
                <button className='w-full border border-gray-200 text-red-500 rounded-lg py-2 text-sm hover:bg-red-50'>Descalificar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className='text-xl font-medium text-gray-900 mb-6'>Leads ({total})</h1>
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <table className='w-full text-sm'>
          <thead><tr className='border-b border-gray-100'>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Empresa</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Contacto</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Google</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Canal</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Estado</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className='px-4 py-8 text-center text-gray-400'>Cargando...</td></tr>
            : leads.length === 0 ? <tr><td colSpan={5} className='px-4 py-8 text-center text-gray-400'>Sin leads</td></tr>
            : leads.map((lead: any) => (
              <tr key={lead.id} className='border-b border-gray-50 hover:bg-gray-50 cursor-pointer' onClick={() => setSelected(lead)}>
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    {lead.googlePhotoUrl ? (
                      <img src={lead.googlePhotoUrl} alt={lead.companyName} className='w-8 h-8 rounded-lg object-cover flex-shrink-0' />
                    ) : (
                      <div className='w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-medium flex-shrink-0'>
                        {lead.companyName?.[0] || '?'}
                      </div>
                    )}
                    <div>
                      <p className='font-medium text-gray-900'>{lead.companyName || '-'}</p>
                      {lead.googleAddress && <p className='text-xs text-gray-400'>{lead.googleAddress.split(',')[0]}</p>}
                    </div>
                  </div>
                </td>
                <td className='px-4 py-3'>
                  <p className='text-gray-900'>{lead.contactName}</p>
                  <p className='text-xs text-gray-400'>{lead.contactEmail}</p>
                </td>
                <td className='px-4 py-3'>
                  {lead.googleRating ? (
                    <span className='text-amber-500 font-medium'>★ {lead.googleRating}</span>
                  ) : (
                    <span className='text-gray-300 text-xs'>Sin datos</span>
                  )}
                </td>
                <td className='px-4 py-3 text-gray-600'>{lead.sourceChannel}</td>
                <td className='px-4 py-3'><span className='bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full'>{lead.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
