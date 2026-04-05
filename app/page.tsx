'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@everclean.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.role);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm'>
        <div className='flex items-center gap-3 mb-8'>
          <div className='w-10 h-10 rounded-xl bg-emerald-700'></div>
          <div>
            <h1 className='text-lg font-medium text-gray-900'>EverClean</h1>
            <p className='text-xs text-gray-500'>Admin Dashboard</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className='space-y-4'>
          <div>
            <label className='text-sm text-gray-600 block mb-1'>Email</label>
            <input type='email' value={email} onChange={e => setEmail(e.target.value)} className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500' required />
          </div>
          <div>
            <label className='text-sm text-gray-600 block mb-1'>Contrasena</label>
            <input type='password' value={password} onChange={e => setPassword(e.target.value)} className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500' required />
          </div>
          {error && <p className='text-red-500 text-sm'>{error}</p>}
          <button type='submit' disabled={loading} className='w-full bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-800 disabled:opacity-50'>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}