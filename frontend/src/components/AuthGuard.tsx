'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUser } from '@/lib/api';
import Sidebar from './Sidebar';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const user = getUser();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token && !isLoginPage) {
      router.replace('/login');
      return;
    }
    if (token && isLoginPage) {
      router.replace('/dashboard');
      return;
    }
    setReady(true);
  }, [pathname, isLoginPage, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
