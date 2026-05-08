'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation, LANGUAGE_OPTIONS } from '../../lib/i18n/useTranslation';

const NAV_ICONS: Record<string, JSX.Element> = {
  '/dashboard': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  '/dashboard/leads': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  '/dashboard/bookings': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  '/dashboard/professionals': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  '/dashboard/map': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') { router.push('/'); return; }
    setReady(true);
  }, [router]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function logout() { localStorage.clear(); router.push('/'); }

  const navItems = [
    { href: '/dashboard', label: t('sidebar.dashboard') },
    { href: '/dashboard/leads', label: t('sidebar.leads') },
    { href: '/dashboard/bookings', label: t('sidebar.bookings') },
    { href: '/dashboard/professionals', label: t('sidebar.professionals') },
    { href: '/dashboard/map', label: t('sidebar.liveMap') },
  ];

  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === lang) || LANGUAGE_OPTIONS[0];

  if (!ready) return null;

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo.jpg" alt="EverClean" width={40} height={40} style={{ borderRadius: 10 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              Ever<span style={{ color: '#4CAF50' }}>Clean</span>
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4CAF50', fontWeight: 700, marginTop: 3 }}>
              Admin Portal
            </div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ margin: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1565C0, #4CAF50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>AD</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Admin</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t('admin.dashboard.systemStatus')}</div>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: '16px 16px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
        {t('sidebar.navigation')}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #4CAF50' : '3px solid transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: isActive ? 700 : 400,
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}>
                <span style={{ color: isActive ? '#4CAF50' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                  {NAV_ICONS[item.href]}
                </span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Language + Logout */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Language selector */}
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'transparent', border: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 16 }}>{currentLang.flag}</span>
            <span style={{ flex: 1, textAlign: 'left', fontSize: 12 }}>{currentLang.label}</span>
            <span style={{ fontSize: 10, opacity: 0.5 }}>{langOpen ? '▲' : '▼'}</span>
          </button>
          {langOpen && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#1a2744', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto', zIndex: 100, marginBottom: 4 }}>
              {LANGUAGE_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => { setLang(opt.code); setLangOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: lang === opt.code ? 'rgba(76,175,80,0.15)' : 'transparent', border: 0, color: lang === opt.code ? '#4CAF50' : 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                  {lang === opt.code && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'transparent', border: 0, color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {t('common.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Desktop sidebar */}
      <aside style={{ width: 252, minHeight: '100vh', flexShrink: 0, background: 'linear-gradient(180deg, #081F4A 0%, #0D3781 60%, #0C4B3B 100%)', position: 'sticky', top: 0, display: 'none' }} className="lg-sidebar">
        <style>{`.lg-sidebar { display: flex !important; flex-direction: column; } @media (max-width: 1024px) { .lg-sidebar { display: none !important; } } @media (max-width: 1024px) { .mobile-header { display: flex !important; } } .mobile-header { display: none; }`}</style>
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="mobile-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, background: 'linear-gradient(135deg, #081F4A, #0D3781)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo.jpg" alt="EverClean" width={32} height={32} style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>Ever<span style={{ color: '#4CAF50' }}>Clean</span></span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'rgba(255,255,255,0.1)', border: 0, color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
          {menuOpen ? '✕' : 'Menu'}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, paddingTop: 58 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMenuOpen(false)} />
          <aside style={{ position: 'relative', width: 280, height: '100%', background: 'linear-gradient(180deg, #081F4A 0%, #0D3781 60%, #0C4B3B 100%)', display: 'flex', flexDirection: 'column' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0, padding: '28px', paddingTop: 'max(28px, env(safe-area-inset-top))' }} className="main-content">
        <style>{`@media (max-width: 1024px) { .main-content { padding-top: 86px !important; } }`}</style>
        {children}
      </main>
    </div>
  );
}
