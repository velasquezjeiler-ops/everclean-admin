'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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

  function logout() { localStorage.removeItem('token'); localStorage.removeItem('role'); router.push('/'); }

  const navItems = [
    { href: '/dashboard', label: t('sidebar.dashboard'), icon: '📊' },
    { href: '/dashboard/leads', label: t('sidebar.leads'), icon: '🎯' },
    { href: '/dashboard/bookings', label: t('sidebar.bookings'), icon: '📋' },
    { href: '/dashboard/professionals', label: t('sidebar.professionals'), icon: '👷' },
    { href: '/dashboard/map', label: t('sidebar.liveMap'), icon: '🗺️' },
  ];

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center"><span className="text-white text-xs font-bold">EC</span></div>
          <span className="font-semibold text-gray-900 text-sm">EverClean</span>
          <span className="text-xs text-purple-600 font-medium">{t('sidebar.admin')}</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100">
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </header>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-black/50 z-30" onClick={() => setMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4 space-y-2" onClick={e => e.stopPropagation()}>
            {navItems.map(item => (<Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${(pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href)))?'bg-emerald-50 text-emerald-700 font-medium':'text-gray-600'}`}><span className="text-lg">{item.icon}</span><span>{item.label}</span></Link>))}
            <div className="border-t border-gray-100 pt-3 mt-3"><LanguageSelector lang={lang} setLang={setLang} /></div>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50"><span className="text-lg">🚪</span><span>{t('common.logout')}</span></button>
          </div>
        </div>
      )}
      <aside className="hidden md:flex w-44 bg-white border-r border-gray-200 flex-col min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-gray-100"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">EC</span></div><div className="min-w-0"><p className="font-semibold text-gray-900 text-sm truncate">EverClean</p><p className="text-xs text-purple-600 font-medium">{t('sidebar.admin')}</p></div></div></div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (<Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${(pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href)))?'bg-emerald-50 text-emerald-700 font-medium':'text-gray-600 hover:bg-gray-50'}`}><span className="text-base">{item.icon}</span><span>{item.label}</span></Link>))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <LanguageSelector lang={lang} setLang={setLang} />
          <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"><span className="text-base">🚪</span><span>{t('common.logout')}</span></button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
