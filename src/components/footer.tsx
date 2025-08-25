
'use client';

import Link from 'next/link';
import { Home, MessageSquare, Compass, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Footer() {
  const pathname = usePathname();

  const isChatPage = pathname.startsWith('/chatroom/');

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/chatroom', icon: MessageSquare, label: 'Chats' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  if (isChatPage) {
    return null;
  }

  return (
    <>
      {/* Mobile Footer */}
      <footer className="fixed bottom-0 left-0 z-40 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
        <nav className="grid h-16 grid-cols-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group inline-flex flex-col items-center justify-center px-5 focus:outline-none transition-colors',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn("h-6 w-6 mb-1",
                 pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </footer>
      <div className="h-16 md:hidden"></div> {/* Spacer for mobile footer */}


      {/* Desktop Footer */}
      <footer className="hidden md:block w-full border-t bg-background">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © 2025 LocalHost. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
