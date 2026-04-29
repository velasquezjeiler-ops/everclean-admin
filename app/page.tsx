'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(''); setLoading(true);
    try {
      const res = await fetch(API+'/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      if (data.role !== 'ADMIN') throw new Error('Admin access required');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', data.role);
      router.push('/dashboard');
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{background:'linear-gradient(135deg, #0f2942 0%, #1a3a5c 50%, #1e4d2b 100%)'}}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="mb-8"><Image src="/logo.jpg" alt="EverClean" width={80} height={80} className="rounded-2xl shadow-2xl" /></div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">EverClean<br /><span className="text-amber-400">Admin Panel</span></h1>
          <p className="text-lg text-blue-200/80 max-w-md mb-8">Manage your cleaning platform, professionals, bookings, and leads from one powerful dashboard.</p>
          <div className="flex gap-6">
            <div className="text-center"><p className="text-3xl font-bold text-white">📊</p><p className="text-xs text-blue-300">Dashboard</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-white">🗺️</p><p className="text-xs text-blue-300">Live Map</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-white">👷</p><p className="text-xs text-blue-300">Team</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-white">📈</p><p className="text-xs text-blue-300">Analytics</p></div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.jpg" alt="EverClean" width={64} height={64} className="rounded-xl shadow-lg mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">EverClean Admin</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 hidden lg:block mb-1">Admin Login</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to manage your platform</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div><label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@evercleanapp.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
            <div><label className="text-xs font-medium text-gray-600 block mb-1.5">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
            {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3"><span>⚠️</span>{error}</div>}
            <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{background:'linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%)'}}>
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading...</span> : 'Sign in to Admin'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">© 2026 EverClean App. Admin Portal.</p>
        </div>
      </div>
    </div>
  );
}
