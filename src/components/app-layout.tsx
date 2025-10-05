
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MainNav } from '@/components/main-nav';
import { InstallPwaButton } from '@/components/install-pwa-button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isWelcome, setIsWelcome] = useState(true);

  useEffect(() => {
    // We determine if we are on the welcome screen based on local storage.
    // This client-side check ensures the server doesn't prematurely decide to show the nav.
    const hasVisited = localStorage.getItem('hasVisited');
    setIsWelcome(!hasVisited);
  }, [pathname]); // Re-check when the path changes

  // The welcome screen should not have the main navigation or its padding.
  const showNav = !isWelcome;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {showNav && <InstallPwaButton />}
      {/* The main content area's bottom padding is adjusted based on nav visibility */}
      <main className={`flex-1 ${showNav ? 'pb-24' : ''}`}>{children}</main>
      {showNav && <MainNav />}
    </div>
  );
}
