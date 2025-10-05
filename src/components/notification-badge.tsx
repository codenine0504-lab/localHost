
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
            let notificationFound = false;

            // Check for new join requests
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                 if (key && key.startsWith('hasNewJoinRequests_') && localStorage.getItem(key) === 'true') {
                    notificationFound = true;
                    break;
                }
            }
            
            if (notificationFound) {
                setHasNotification(true);
                return;
            }

            // Check for new messages in any chat
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('lastMessageTimestamp_')) {
                    const roomId = key.substring('lastMessageTimestamp_'.length);
                    
                    const lastMessageSenderId = localStorage.getItem(`lastMessageSenderId_${roomId}`);
                    if (lastMessageSenderId === user.id) {
                        continue; // It's our own message, skip.
                    }

                    const lastMessageTimestampStr = localStorage.getItem(key);
                    const lastReadTimestampStr = localStorage.getItem(`lastRead_${roomId}`);
                    
                    const lastMessageTimestamp = lastMessageTimestampStr ? parseInt(lastMessageTimestampStr, 10) : 0;
                    const lastReadTimestamp = lastReadTimestampStr ? parseInt(lastReadTimestampStr, 10) : 0;

                    if (lastMessageTimestamp > 0 && lastMessageTimestamp > lastReadTimestamp) {
                        notificationFound = true;
                        break;
                    }
                }
            }

            setHasNotification(notificationFound);
        };

        checkNotifications();

        const handleStorageChange = (event: Event) => {
            // Check if the event is 'storage' to avoid reacting to other events.
            if ((event as StorageEvent).key?.includes('lastMessage') || (event as StorageEvent).key?.includes('lastRead') || (event as StorageEvent).key?.includes('hasNewJoinRequests')) {
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

    
