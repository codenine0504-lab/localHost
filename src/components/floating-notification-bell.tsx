
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

export function FloatingNotificationBell() {
    const [hasNotification, setHasNotification] = useState(false);
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const checkNotifications = () => {
            if (!user) {
                setHasNotification(false);
                return;
            }

            // Check for new join requests for the current user
            const hasNewJoinRequests = localStorage.getItem(`hasNewJoinRequests_${user.uid}`) === 'true';
            if (hasNewJoinRequests) {
                setHasNotification(true);
                return;
            }

            // Check for new messages in any chat
            let hasNewMessage = false;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('lastMessageTimestamp_')) {
                    const parts = key.split('_');
                    if (parts.length < 4) continue;
                    const roomId = parts[2];
                    const tab = parts[3];

                    const lastMessageTimestampStr = localStorage.getItem(key);
                    const lastReadTimestampStr = localStorage.getItem(`lastRead_${roomId}_${tab}`);
                    
                    const lastMessageTimestamp = lastMessageTimestampStr ? parseInt(lastMessageTimestampStr, 10) : 0;
                    const lastReadTimestamp = lastReadTimestampStr ? parseInt(lastReadTimestampStr, 10) : Date.now();
                    
                    if (lastMessageTimestamp > lastReadTimestamp) {
                        hasNewMessage = true;
                        break; 
                    }
                }
            }
            setHasNotification(hasNewMessage);
        };

        checkNotifications();

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key?.includes('lastMessageTimestamp_') || event.key?.includes('lastRead_') || event.key?.includes('hasNewJoinRequests_')) {
                checkNotifications();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        document.addEventListener('visibilitychange', checkNotifications);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', checkNotifications);
        };
    }, [user]);

    if (loading || !user || user.isAnonymous) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            <Link href="/chatroom">
                <Button variant="outline" size="icon" className="relative rounded-full h-12 w-12 shadow-lg">
                    <Bell className="h-6 w-6" />
                    {hasNotification && (
                        <div className="absolute top-1 right-1 h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </div>
                    )}
                </Button>
            </Link>
        </div>
    );
}
