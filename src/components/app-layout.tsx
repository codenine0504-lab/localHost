
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MainNav } from '@/components/main-nav';
import { InstallPwaButton } from '@/components/install-pwa-button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const checkNavVisibility = () => {
      const hasVisited = localStorage.getItem('hasVisited');
      setShowNav(!!hasVisited);
    }
    
    // Check immediately on mount
    checkNavVisibility();

    // Listen for storage changes to update immediately
    const handleStorageChange = () => {
      checkNavVisibility();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {showNav && <InstallPwaButton />}
      {/* The main content area's bottom padding is adjusted based on nav visibility */}
      <main className={`flex-1 ${showNav ? 'pb-24' : ''}`}>{children}</main>
      {showNav && <MainNav />}
    </div>
  );
}
