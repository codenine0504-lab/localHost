
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, UserCircle, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadge } from './notification-badge';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/projects', label: 'Explore', icon: Compass },
  { href: '/people', label: 'Search', icon: Search },
  { href: '/chatroom', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

function BottomNav() {
  const pathname = usePathname();

  const isChatPage = pathname.startsWith('/chatroom/');

  if (isChatPage && pathname !== '/chatroom') {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full z-50 p-2 md:bottom-4">
      <motion.nav
        layout
        className="flex h-16 max-w-md mx-auto items-center justify-around rounded-full border border-white/10 bg-black backdrop-blur-sm shadow-lg px-2"
      >
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
          
          const navLink = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center justify-center rounded-full text-muted-foreground transition-colors z-10',
                isActive ? 'text-primary-foreground' : 'hover:text-accent-foreground'
              )}
            >
              <motion.div
                layout
                className={cn(
                  "flex items-center justify-center gap-2 rounded-full px-3 py-2",
                   isActive ? '' : 'w-12 h-12'
                )}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
              </motion.div>
            </Link>
          );

          return (
             <motion.div layout key={item.href} className="relative flex items-center justify-center">
                 {isActive && (
                    <motion.div
                        layoutId="active-nav-background"
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                )}
                {item.href === '/chatroom' ? (
                    <NotificationBadge>{navLink}</NotificationBadge>
                ) : (
                    navLink
                )}
            </motion.div>
          )
        })}
      </motion.nav>
    </footer>
  );
}


export function MainNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user) {
                const user = result.user;
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                    }, { merge: true });
                }
            }
        } catch (error) {
            console.error("Error handling redirect result:", error);
        }
    };
    handleRedirect();
  }, []);

  if (loading || !user) {
    return null; 
  }

  return <BottomNav />;
}
