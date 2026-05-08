'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getLoginBases, rememberApiBase } from '../lib/apiBase';

const C = {
  navy: '#0D3781', navyDark: '#081f4a',
  green: '#4CAF50', greenDk: '#388E3C',
  ink: '#0D1B2A', muted: '#64748B',
  border: '#E2E8F0', danger: '#DC2626',
};

const features = [
  { icon: '⚡', label: 'Operations', detail: 'Manage bookings in real time' },
  { icon: '🗺️', label: 'Live Map', detail: 'Track field professionals' },
  { icon: '👥', label: 'Team', detail: 'Full team management' },
];

async function readResponse(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text.includes('Authentication Required')
        ? 'Vercel protection blocked the API route'
        : 'Unexpected API response',
      html: true,
    };
  }
}

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
      const normalizedEmail = email.trim().toLowerCase();
      const loginBases = getLoginBases();
      let lastError = 'Unable to reach the API. Check the backend deployment URL.';

      for (let index = 0; index < loginBases.length; index += 1) {
        const base = loginBases[index];
        try {
          const res = await fetch(base + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password }),
          });
          const data = await readResponse(res);
          if (!res.ok) {
            lastError = data.error || 'Invalid credentials';
            const canRetryDirect = base === '/api' && (res.status >= 500 || data.html || /reach|backend|vercel/i.test(lastError));
            if (canRetryDirect) continue;
            throw new Error(lastError);
          }
          if (data.role !== 'ADMIN') throw new Error('Admin access required');
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken || '');
          localStorage.setItem('role', data.role);
          rememberApiBase(base);
          router.push('/dashboard');
          return;
        } catch (err: any) {
          lastError = err?.message || lastError;
          if (index < loginBases.length - 1) continue;
          throw new Error(lastError === 'Failed to fetch'
            ? 'Unable to reach the API. Check the backend deployment URL.'
            : lastError);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to sign in');
    } finally { setLoading(false); }
  }

  const disabled = loading || !email || !password;

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, rgba(76,175,80,0.13), transparent 30%), linear-gradient(135deg, #f8fbff 0%, #F5F7FA 48%, #edf7f1 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 28, fontFamily: "'Inter', system-ui, sans-serif", color: C.ink,
    }}>
      <div style={{
        width: '100%', maxWidth: 1100,
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px',
        gap: 20, alignItems: 'stretch',
      }}>

        {/* HERO */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 20,
          background: 'linear-gradient(135deg, #081f4a 0%, #123a62 48%, #0d4a2e 100%)',
          color: '#fff', padding: 42,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minHeight: 540,
        }}>
          <div style={{ position: 'absolute', right: -110, bottom: -130, width: 320, height: 320, borderRadius: '50%', background: 'rgba(76,175,80,0.16)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            <Image src="/logo.jpg" alt="EverClean" width={52} height={52} style={{ borderRadius: 14 }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
                Ever<span style={{ color: C.green }}>Clean</span>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginTop: 4 }}>
                Admin Portal
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, padding: '40px 0' }}>
            <h1 style={{ fontSize: 'clamp(32px,4vw,50px)', fontWeight: 600, lineHeight: 1.08, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
              Command center<br />for every clean.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.72)', margin: 0, maxWidth: 480 }}>
              Manage bookings, professionals, leads, and live operations from one focused dashboard.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, position: 'relative', zIndex: 1 }}>
            {features.map(f => (
              <div key={f.label} style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 14px' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{f.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div style={{
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20,
          boxShadow: '0 2px 8px rgba(13,55,129,0.06)', padding: '40px 36px',
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: C.muted, margin: '0 0 28px' }}>
              Sign in to your admin account
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="admin@everclean.com"
                  autoComplete="email"
                  style={{ width: '100%', height: 52, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 14px', fontSize: 14, color: C.ink, background: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = C.green; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.14)'; }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ width: '100%', height: 52, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 14px', fontSize: 14, color: C.ink, background: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = C.green; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.14)'; }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div style={{ border: '1px solid #fecaca', background: '#fef2f2', color: C.danger, borderRadius: 14, padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={disabled}
                style={{
                  width: '100%', minHeight: 52, border: 0, borderRadius: 9999,
                  background: disabled ? '#a5d6a7' : C.green,
                  color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.15s',
                }}
              >
                {loading ? 'Signing in…' : 'Sign in to Admin'}
              </button>
            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
              © 2026 EverClean App · Admin Portal
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
// cache bust 1778209391
