'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/');
    else setReady(true);
  }, [router]);
  function logout() {
    localStorage.removeItem('token');
    router.push('/');
  }
  if (!ready) return null;
  const links = [
    { href: '/dashboard', label: 'Resumen' },
    { href: '/dashboard/leads', label: 'Leads' },
    { href: '/dashboard/bookings', label: 'Bookings' },
    { href: '/dashboard/professionals', label: 'Profesionales' },
  ];
  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <aside className='w-52 bg-white border-r border-gray-200 flex flex-col'>
        <div className='p-4 border-b border-gray-200'>
          <div className='flex items-center gap-2'>
            <div className='w-7 h-7 rounded-lg bg-emerald-700'></div>
            <span className='font-medium text-gray-900 text-sm'>EverClean</span>
          </div>
        </div>
        <nav className='flex-1 p-3 space-y-1'>
          {links.map(link => (
            <Link key={link.href} href={link.href} className={'block px-3 py-2 rounded-lg text-sm ' + (pathname === link.href ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50')}>{link.label}</Link>
          ))}
        </nav>
        <div className='p-3 border-t border-gray-200'>
          <button onClick={logout} className='w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50'>Cerrar sesion</button>
        </div>
      </aside>
      <main className='flex-1 p-8 overflow-auto'>{children}</main>
    </div>
  );
}