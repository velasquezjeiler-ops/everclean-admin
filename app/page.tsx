'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';

const features = [
  { label: 'Operations', detail: 'Dashboard control' },
  { label: 'Live Map', detail: 'Field visibility' },
  { label: 'Professionals', detail: 'Team management' },
];

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      if (data.role !== 'ADMIN') throw new Error('Admin access required');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken || '');
      localStorage.setItem('role', data.role);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.message === 'Failed to fetch'
        ? 'Unable to reach the API. Check the backend deployment URL.'
        : e?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-5 py-10 font-sans">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_8%_8%,rgba(76,175,80,0.14),transparent_28%),radial-gradient(circle_at_84%_82%,rgba(13,55,129,0.08),transparent_30%)]" />
      <section className="relative w-full max-w-[1120px] grid lg:grid-cols-[1.45fr_1fr] gap-6 items-stretch">
        <div className="hidden lg:flex rounded-[22px] overflow-hidden min-h-[640px] shadow-[0_24px_70px_rgba(13,55,129,0.15)]" style={{ background: 'linear-gradient(145deg, #0D2B5F 0%, #12416D 52%, #0B5A3D 100%)' }}>
          <div className="relative flex flex-col justify-between w-full p-10 text-white">
            <div>
              <div className="flex items-center gap-4">
                <Image src="/logo.jpg" alt="EverClean" width={58} height={58} className="rounded-2xl shadow-xl" />
                <div>
                  <div className="text-2xl font-extrabold leading-none">Ever<span className="text-[#4CAF50]">Clean</span></div>
                  <div className="mt-1 text-xs tracking-[0.22em] uppercase text-[#4CAF50] font-bold">Admin Portal</div>
                </div>
              </div>
            </div>
            <div className="max-w-[680px]">
              <h1 className="text-[54px] leading-[1.04] font-extrabold tracking-normal mb-5">Command center for every clean.</h1>
              <p className="text-lg leading-8 text-blue-100/85 max-w-[590px]">Manage bookings, professionals, leads, live operations, and service quality from one focused dashboard.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-[720px]">
              {features.map((f) => (
                <div key={f.label} className="rounded-xl border border-white/14 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <div className="text-sm font-bold">{f.label}</div>
                  <div className="mt-1 text-xs text-blue-100/75">{f.detail}</div>
                </div>
              ))}
            </div>
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#4CAF50]/16" />
          </div>
        </div>

        <div className="bg-white rounded-[22px] shadow-[0_24px_70px_rgba(13,55,129,0.12)] border border-[#E2E8F0] px-7 py-10 lg:px-10 flex flex-col justify-center min-h-[560px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Image src="/logo.jpg" alt="EverClean" width={48} height={48} className="rounded-xl shadow" />
            <div>
              <div className="text-xl font-extrabold">Ever<span className="text-[#4CAF50]">Clean</span></div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#4CAF50] font-bold">Admin Portal</div>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-[#0D1B2A] tracking-normal">Admin Login</h2>
          <p className="mt-2 text-sm text-[#64748B]">Sign in to manage the EverClean platform.</p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#334155] block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@everclean.com"
                className="w-full rounded-xl border border-[#D8E1EE] px-4 py-3.5 text-sm outline-none focus:border-[#1565C0] focus:ring-4 focus:ring-[#1565C0]/10"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#334155] block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#D8E1EE] px-4 py-3.5 text-sm outline-none focus:border-[#1565C0] focus:ring-4 focus:ring-[#1565C0]/10"
              />
            </div>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl border-0 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(13,55,129,0.22)] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0D3781, #1565C0)' }}
            >
              {loading ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </div>
          <p className="mt-10 text-center text-xs text-[#94A3B8]">(c) 2026 EverClean App. Admin Portal.</p>
        </div>
      </section>
    </main>
  );
}