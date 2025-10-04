
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
                    if (parts.length < 3) continue; // Skip malformed keys
                    const roomId = parts.slice(2).join('_');

                    const lastMessageTimestampStr = localStorage.getItem(key);
                    const lastReadTimestampStr = localStorage.getItem(`lastRead_${roomId}`);
                    
                    const lastMessageTimestamp = lastMessageTimestampStr ? parseInt(lastMessageTimestampStr, 10) : 0;
                    
                    // If lastRead doesn't exist, it means the user has never opened the chat, so no notification unless there is a message.
                    // But if there's no message timestamp, there's no notification.
                    // If there IS a message, but no read timestamp, it's a new message.
                    const lastReadTimestamp = lastReadTimestampStr ? parseInt(lastReadTimestampStr, 10) : 0;

                    if (lastMessageTimestamp > 0 && lastMessageTimestamp > lastReadTimestamp) {
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
