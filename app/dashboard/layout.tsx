'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '../../lib/i18n/useTranslation';
import LanguageSelector from '../../lib/i18n/LanguageSelector';

type NavItem = { href: string; label: string; icon: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') {
      router.push('/');
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function logout() {
    localStorage.clear();
    router.push('/');
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: t('sidebar.dashboard'), icon: 'D' },
    { href: '/dashboard/leads', label: t('sidebar.leads'), icon: 'L' },
    { href: '/dashboard/bookings', label: t('sidebar.bookings'), icon: 'B' },
    { href: '/dashboard/professionals', label: t('sidebar.professionals'), icon: 'P' },
    { href: '/dashboard/map', label: t('sidebar.liveMap'), icon: 'M' },
  ];

  if (!ready) return null;

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="EverClean" width={42} height={42} className="rounded-xl shadow-md" />
          <div>
            <p className="font-extrabold text-white text-base leading-none">Ever<span className="text-[#4CAF50]">Clean</span></p>
            <p className="text-[10px] text-[#4CAF50] font-bold tracking-[0.16em] uppercase mt-1">Admin Portal</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-4 rounded-xl border border-white/12 bg-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#1565C0] to-[#4CAF50] text-white flex items-center justify-center text-sm font-extrabold">AD</div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-white truncate">Admin</div>
            <div className="text-[11px] text-white/60">Operations control</div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-7 pb-2 text-[10px] uppercase tracking-[0.18em] font-bold text-white/34">Navigation</div>
      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${isActive ? 'bg-white/12 text-white font-extrabold border border-white/12 shadow-[inset_4px_0_0_#4CAF50]' : 'text-white/62 hover:bg-white/8 hover:text-white'}`}
            >
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${isActive ? 'bg-[#4CAF50]/20 text-[#B8F3C8]' : 'bg-white/8 text-white/54'}`}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        <LanguageSelector lang={lang} setLang={setLang} />
        <button onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-white/45 hover:bg-red-500/15 hover:text-red-200 transition-all">
          <span className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/8">S</span>
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0D1B2A] flex">
      <aside className="hidden lg:flex w-[244px] min-h-screen flex-col shrink-0 ec-sidebar sticky top-0">
        <SidebarContent />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 ec-sidebar border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="EverClean" width={34} height={34} className="rounded-lg" />
          <span className="font-extrabold text-white">Ever<span className="text-[#4CAF50]">Clean</span></span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="h-10 w-10 rounded-xl bg-white/10 text-white font-bold">{menuOpen ? 'X' : 'M'}</button>
      </header>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 pt-[58px]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-[280px] ec-sidebar flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-[68px] lg:pt-0 p-4 lg:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}