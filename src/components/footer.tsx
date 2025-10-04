
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
    return null; 
  }

  if (!user || (isChatPage && pathname !== '/chatroom')) {
    return null;
  }

  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-md z-50 md:hidden">
      <nav className="flex h-16 w-full items-center justify-around rounded-full border bg-background/90 backdrop-blur-sm shadow-lg">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          const navLink = (
             <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-full text-muted-foreground transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="sr-only">{item.label}</span>
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
