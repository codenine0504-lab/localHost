
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageSquare, Users, UserCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadge } from './notification-badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navItems = [
  { href: '/', label: 'Home', icon: Home, auth: false },
  { href: '/projects', label: 'Explore', icon: Compass, auth: false },
  { href: '/people', label: 'People', icon: Users, auth: false },
  { href: '/chatroom', label: 'Chat', icon: MessageSquare, auth: true },
];

function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isChatPage = pathname.startsWith('/chatroom/');
  if (isChatPage && pathname !== '/chatroom') {
    return null;
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const visibleNavItems = navItems.filter(item => !item.auth || !!user);

  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full z-50 p-2 md:bottom-4">
      <motion.nav
        layout
        className="flex h-16 max-w-md mx-auto items-center justify-around rounded-full border border-white/10 bg-black backdrop-blur-sm shadow-lg px-2"
      >
        {visibleNavItems.map((item) => {
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
        
        {/* Profile/Login Icon */}
        <motion.div layout className="relative flex items-center justify-center">
           {!loading && (
             user ? (
               <Link href={`/profile/${user.id}`} className="relative flex items-center justify-center rounded-full text-muted-foreground transition-colors z-10 hover:text-accent-foreground w-12 h-12">
                   <Avatar className="h-8 w-8">
                       <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                       <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                   </Avatar>
               </Link>
             ) : (
               <Link href="/settings" className="relative flex items-center justify-center rounded-full text-muted-foreground transition-colors z-10 hover:text-accent-foreground w-12 h-12">
                   <Settings className="h-6 w-6" />
               </Link>
             )
           )}
        </motion.div>

      </motion.nav>
    </footer>
  );
}

export function MainNav() {
  return <BottomNav />;
}
