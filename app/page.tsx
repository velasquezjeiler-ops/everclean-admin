'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const C = {
  navy: '#0D3781', navyDark: '#081f4a',
  green: '#4CAF50', greenDk: '#388E3C',
  blue: '#1565C0',
  canvas: '#FFFFFF', soft: '#F5F7FA',
  ink: '#0D1B2A', muted: '#64748B',
  border: '#E2E8F0', shadow: '0 2px 8px rgba(13,55,129,0.06)',
  danger: '#DC2626',
};
const R = { sm: '8px', md: '14px', lg: '20px', full: '9999px' };

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
    <main style={{ minHeight: '100vh', background: `radial-gradient(circle at top left, rgba(76,175,80,0.13), transparent 30%), linear-gradient(135deg, #f8fbff 0%, ${C.soft} 48%, #edf7f1 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .admin-login-shell {
          width: 100%; max-width: 1100px;
          display: grid; grid-template-columns: minmax(0,1fr) 420px;
          gap: 20px; align-items: stretch;
        }
        .admin-hero {
          position: relative; overflow: hidden; border-radius: ${R.lg};
          background: linear-gradient(135deg, ${C.navyDark} 0%, #123a62 48%, #0d4a2e 100%);
          color: #fff; padding: 42px;
          display: flex; flex-direction: column; justify-content: space-between;
          min-height: 560px;
        }
        .admin-hero::before {
          content: ""; position: absolute; inset: auto -110px -130px auto;
          width: 320px; height: 320px; border-radius: ${R.full};
          background: rgba(76,175,80,0.16);
        }
        .admin-features { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .admin-feature {
          border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.08);
          border-radius: ${R.md}; padding: 16px 14px;
        }
        .admin-panel {
          background: #fff; border: 1px solid ${C.border}; border-radius: ${R.lg};
          box-shadow: ${C.shadow}; padding: 40px 36px;
          display: flex; align-items: center;
        }
        .admin-field label {
          display: block; font-size: 11px; font-weight: 600; color: ${C.muted};
          margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.6px;
        }
        .admin-field input {
          width: 100%; height: 52px; border: 1px solid ${C.border};
          border-radius: ${R.sm}; padding: 0 14px; font-size: 14px;
          color: ${C.ink}; background: #fff; outline: none;
          transition: border 0.15s, box-shadow 0.15s; font-family: inherit;
        }
        .admin-field input:focus {
          border-color: ${C.green};
          box-shadow: 0 0 0 3px rgba(76,175,80,0.14);
        }
        .admin-submit {
          width: 100%; min-height: 52px; border: 0; border-radius: ${R.full};
          background: ${C.green}; color: #fff; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s, transform 0.15s;
          font-family: inherit;
        }
        .admin-submit:hover:not(:disabled) { transform: translateY(-1px); background: ${C.greenDk}; }
        .admin-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        @media (max-width: 900px) {
          .admin-login-shell { grid-template-columns: 1fr; max-width: 500px; }
          .admin-hero { display: none; }
          .admin-panel { min-height: calc(100vh - 56px); }
        }
      `}</style>

      <div className="admin-login-shell">

        {/* HERO */}
        <div className="admin-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            <Image src="/logo.jpg" alt="EverClean" width={52} height={52} style={{ borderRadius: R.md, boxShadow: C.shadow }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
                Ever<span style={{ color: C.green }}>Clean</span>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginTop: 4 }}>
                Admin Portal
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 50px)', fontWeight: 600, lineHeight: 1.08, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
              Command center<br />for every clean.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.72)', margin: 0 }}>
              Manage bookings, professionals, leads, and live operations from one focused dashboard.
            </p>
          </div>

          <div className="admin-features" style={{ position: 'relative', zIndex: 1 }}>
            {features.map(f => (
              <div key={f.label} className="admin-feature">
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{f.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM PANEL */}
        <div className="admin-panel">
          <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Admin Login
            </h2>
            <p style={{ fontSize: 14, color: C.muted, margin: '0 0 32px' }}>
              Sign in to manage the EverClean platform.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="admin@everclean.com"
                  autoComplete="email"
                />
              </div>

              <div className="admin-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div style={{ border: '1px solid #fecaca', background: '#fef2f2', color: C.danger, borderRadius: R.md, padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="admin-submit"
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
