'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    api.leads.list(token).then(data => { setLeads(data.data || []); setTotal(data.total || 0); setLoading(false); });
  }, []);
  return (
    <div>
      <h1 className='text-xl font-medium text-gray-900 mb-6'>Leads ({total})</h1>
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <table className='w-full text-sm'>
          <thead><tr className='border-b border-gray-100'>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Contacto</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Empresa</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Google Rating</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Canal</th>
            <th className='text-left px-4 py-3 text-gray-500 font-medium'>Estado</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className='px-4 py-8 text-center text-gray-400'>Cargando...</td></tr>
            : leads.length === 0 ? <tr><td colSpan={5} className='px-4 py-8 text-center text-gray-400'>Sin leads</td></tr>
            : leads.map((lead) => (
              <tr key={lead.id} className='border-b border-gray-50 hover:bg-gray-50'>
                <td className='px-4 py-3'><p className='font-medium text-gray-900'>{lead.contactName}</p><p className='text-gray-400 text-xs'>{lead.contactEmail}</p></td>
                <td className='px-4 py-3 text-gray-600'>{lead.companyName || '-'}</td>
                <td className='px-4 py-3'>{lead.googleRating ? <span className='text-amber-500 font-medium'>★ {lead.googleRating}</span> : <span className='text-gray-300'>-</span>}</td>
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