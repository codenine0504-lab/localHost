
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth-provider';

interface NotificationBadgeProps {
    children: React.ReactNode;
}

export function NotificationBadge({ children }: NotificationBadgeProps) {
    const { user } = useAuth();
    const [hasNotification, setHasNotification] = useState(false);

    useEffect(() => {
        if (!user) {
            setHasNotification(false);
            return;
        }

        const checkNotifications = () => {
             // Check for new join requests
            const hasNewJoinRequestsKey = Object.keys(localStorage).find(key => key.startsWith('hasNewJoinRequests_'));
            if (hasNewJoinRequestsKey) {
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
                    
                    const lastMessageSenderId = localStorage.getItem(`lastMessageSenderId_${roomId}`);
                    // Only show notification if the last message was not from the current user
                    if (lastMessageSenderId === user.id) {
                        continue;
                    }

                    const lastMessageTimestampStr = localStorage.getItem(key);
                    const lastReadTimestampStr = localStorage.getItem(`lastRead_${roomId}`);
                    
                    const lastMessageTimestamp = lastMessageTimestampStr ? parseInt(lastMessageTimestampStr, 10) : 0;
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
            if (event.key?.includes('lastMessageTimestamp_') || event.key?.includes('lastRead_') || event.key?.includes('hasNewJoinRequests_') || event.key?.includes('lastMessageSenderId_')) {
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
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
            )}
        </div>
    );
}

    