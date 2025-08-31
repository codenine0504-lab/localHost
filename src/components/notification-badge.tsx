
'use client';

import { useState, useEffect } from 'react';

interface NotificationBadgeProps {
    children: React.ReactNode;
}

export function NotificationBadge({ children }: NotificationBadgeProps) {
    const [hasNotification, setHasNotification] = useState(false);

    useEffect(() => {
        const checkNotifications = () => {
             // Check for new join requests
            const hasNewJoinRequests = localStorage.getItem('hasNewJoinRequests') === 'true';
            if (hasNewJoinRequests) {
                setHasNotification(true);
                return;
            }

            // Check for new messages in any chat
            let hasNewMessage = false;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('lastMessageTimestamp_')) {
                    const roomId = key.substring('lastMessageTimestamp_'.length);
                    const lastMessageTimestampStr = localStorage.getItem(key);
                    const lastReadTimestampStr = localStorage.getItem(`lastRead_${roomId}`);
                    
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

        const handleStorageChange = () => {
            checkNotifications();
        };

        window.addEventListener('storage', handleStorageChange);

        // Also check when the document becomes visible
        document.addEventListener('visibilitychange', checkNotifications);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', checkNotifications);
        };
    }, []);

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
