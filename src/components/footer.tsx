
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, UserCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadge } from './notification-badge';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/projects', label: 'Explore', icon: Compass },
  { href: '/chatroom', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function Footer() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isChatPage = pathname.startsWith('/chatroom/');

  if (loading) {
    return null; // Don't show footer while checking auth state
  }

  if (!user || (isChatPage && pathname !== '/chatroom')) {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className="flex h-16 w-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          const navLink = (
             <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md p-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );

          if (item.href === '/chatroom') {
              return (
                  <NotificationBadge key={item.href}>
                      {navLink}
                  </NotificationBadge>
              )
          }
          
          return navLink;
        })}
      </nav>
    </footer>
  );
}

    