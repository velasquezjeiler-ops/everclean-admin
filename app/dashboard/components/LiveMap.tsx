'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const C = {
  navy: '#0D3781', navyDark: '#081F4A',
  green: '#4CAF50', greenDk: '#388E3C',
  ink: '#0D1B2A', muted: '#64748B',
  border: '#E2E8F0', soft: '#F5F7FA',
};

const features = [
  { icon: '⚡', label: 'Operations', detail: 'Manage bookings in real time' },
  { icon: '🗺️', label: 'Live Map', detail: 'Track field professionals' },
  { icon: '👥', label: 'Team', detail: 'Full team management' },
];

function normalizeEmail(v: string) { return v.trim().toLowerCase(); }

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizeEmail(email), password }),
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
    } finally { setLoading(false); }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <section style={{ width: '100%', maxWidth: 1080, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'stretch' }}>

        {/* LEFT HERO */}
        <div style={{ background: `linear-gradient(145deg, ${C.navyDark} 0%, ${C.navy} 55%, #0C4B3B 100%)`, borderRadius: 20, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 560, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -60, bottom: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(76,175,80,0.12)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Image src="/logo.jpg" alt="EverClean" width={52} height={52} style={{ borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>Ever<span style={{ color: C.green }}>Clean</span></div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginTop: 3 }}>Admin Portal</div>
            </div>
          </div>

          <div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
              Command center<br />for every clean.
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              Manage bookings, professionals, leads, and live operations from one focused dashboard.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {features.map(f => (
              <div key={f.label} style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', padding: '16px 14px', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{f.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT FORM */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(13,55,129,0.06)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.01em' }}>Admin Login</h2>
          <p style={{ fontSize: 14, color: C.muted, margin: '0 0 32px' }}>Sign in to manage the EverClean platform.</p>

          <div style={{ marginBottom: 20 }}>
            <label className="ec-label">Email</label>
            <input
              className="ec-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@everclean.com"
            />
          </div>

          <div style={{ marginBottom: error ? 16 : 24 }}>
            <label className="ec-label">Password</label>
            <input
              className="ec-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#991B1B', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="ec-btn-primary"
            style={{ width: '100%', height: 52, fontSize: 15 }}
          >
            {loading ? 'Signing in…' : 'Sign in to Admin'}
          </button>

          <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
            © 2026 EverClean App · Admin Portal
          </p>
        </div>

      </section>
    </main>
  );
}
