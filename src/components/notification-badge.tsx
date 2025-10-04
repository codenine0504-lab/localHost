
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

interface NotificationBadgeProps {
    children: React.ReactNode;
}

export function NotificationBadge({ children }: NotificationBadgeProps) {
    const [hasNotification, setHasNotification] = useState(false);
    const [user, setUser] = useState<User | null>(auth.currentUser);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
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
             // Only run check if the change is relevant to notifications
            if (event.key?.includes('lastMessageTimestamp_') || event.key?.includes('lastRead_') || event.key?.includes('hasNewJoinRequests_')) {
                checkNotifications();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also check when the document becomes visible
        document.addEventListener('visibilitychange', checkNotifications);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', checkNotifications);
        };
    }, [user]);

    return (
        <div className="relative">
            {children}
            {hasNotification && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </div>
            )}
        </div>
    );
}
