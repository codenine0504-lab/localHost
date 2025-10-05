
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MainNav } from '@/components/main-nav';
import { InstallPwaButton } from '@/components/install-pwa-button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isWelcome, setIsWelcome] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    setIsWelcome(!hasVisited);
  }, [pathname]);

  const showNav = !isWelcome;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {showNav && <InstallPwaButton />}
      <main className={`flex-1 ${showNav ? 'pb-24' : ''}`}>{children}</main>
      {showNav && <MainNav />}
    </div>
  );
}
