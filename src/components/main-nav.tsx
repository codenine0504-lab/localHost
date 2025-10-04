
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, UserCircle, MessageSquare, Search, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadge } from './notification-badge';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/projects', label: 'Explore', icon: Compass },
  { href: '/people', label: 'Search', icon: Search },
  { href: '/chatroom', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

function MobileNav() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const isChatPage = pathname.startsWith('/chatroom/');

  if (!isMobile || (isChatPage && pathname !== '/chatroom')) {
    return null;
  }

  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-md z-50 md:hidden">
      <motion.nav
        layout
        className="flex h-16 w-full items-center justify-around rounded-full border bg-background/90 backdrop-blur-sm shadow-lg px-2"
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

function DesktopNav() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U";
        const nameParts = name.split(" ");
        if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleLogout = async () => {
        try {
          await signOut(auth);
          toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
          });
          router.push('/');
        } catch (error) {
          console.error("Error signing out:", error);
          toast({
            title: "Error",
            description: "Could not log out. Please try again.",
            variant: "destructive",
          });
        }
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{user?.displayName || 'Guest'}</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map(item => {
                        const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
                        const navLink = (
                             <Link href={item.href} className="w-full">
                                <SidebarMenuButton isActive={isActive} icon={<item.icon />}>
                                    {item.label}
                                </SidebarMenuButton>
                            </Link>
                        );
                        return (
                            <SidebarMenuItem key={item.href}>
                               {item.href === '/chatroom' ? (
                                    <NotificationBadge>{navLink}</NotificationBadge>
                                ) : (
                                    navLink
                                )}
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </SidebarFooter>
        </Sidebar>
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

  if (loading || !user) {
    return null; 
  }

  return (
    <>
        <DesktopNav />
        <MobileNav />
    </>
  );
}
