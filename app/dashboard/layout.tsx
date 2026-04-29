'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '../../lib/i18n/useTranslation';
import LanguageSelector from '../../lib/i18n/LanguageSelector';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') { router.push('/'); return; }
    setReady(true);
  }, [router]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  function logout() { localStorage.clear(); router.push('/'); }

  const navItems = [
    { href: '/dashboard', label: t('sidebar.dashboard'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { href: '/dashboard/leads', label: t('sidebar.leads'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { href: '/dashboard/bookings', label: t('sidebar.bookings'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { href: '/dashboard/professionals', label: t('sidebar.professionals'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { href: '/dashboard/map', label: t('sidebar.liveMap'), icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  ];

  if (!ready) return null;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className={`${mobile ? 'p-5' : 'p-4'} border-b border-white/10`}>
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="EverClean" width={36} height={36} className="rounded-lg shadow-md" />
          <div><p className="font-bold text-white text-sm">EverClean</p><p className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase">{t('sidebar.admin')}</p></div>
        </div>
      </div>
      <nav className={`flex-1 ${mobile ? 'p-4' : 'p-3'} space-y-1`}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-white/15 text-white font-medium border-l-2 border-amber-400' : 'text-white/60 hover:bg-white/8 hover:text-white/90'}`}>
              <span className={isActive ? 'text-amber-400' : ''}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={`${mobile ? 'p-4' : 'p-3'} border-t border-white/10 space-y-2`}>
        <LanguageSelector lang={lang} setLang={setLang} />
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40" style={{background:'linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%)'}}>
        <div className="flex items-center gap-2.5"><Image src="/logo.jpg" alt="EC" width={32} height={32} className="rounded-lg" /><span className="font-bold text-white text-sm">EverClean</span></div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:bg-white/10">
          {menuOpen ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
      </header>
      {menuOpen && (<div className="md:hidden fixed inset-0 top-[57px] z-30"><div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} /><div className="relative w-72 h-full ec-sidebar flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}><SidebarContent mobile /></div></div>)}
      <aside className="hidden md:flex w-56 ec-sidebar flex-col min-h-screen flex-shrink-0"><SidebarContent /></aside>
      <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
