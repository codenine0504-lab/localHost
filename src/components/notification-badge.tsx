
'use client';

import { useState, useEffect } from 'react';

interface NotificationBadgeProps {
    children: React.ReactNode;
}

export function NotificationBadge({ children }: NotificationBadgeProps) {
    const [hasNotification, setHasNotification] = useState(false);

    useEffect(() => {
        const checkNotifications = () => {
             // Chat notifications
            const lastTimestampStr = localStorage.getItem('lastMessageTimestamp');
            const lastVisitedChatsStr = localStorage.getItem('lastVisitedChats');
            const lastTimestamp = lastTimestampStr ? parseInt(lastTimestampStr, 10) : 0;
            const lastVisitedChats = lastVisitedChatsStr ? parseInt(lastVisitedChatsStr, 10) : Date.now();
            const hasNewMessage = lastTimestamp > lastVisitedChats;

            // Join request notifications
            const hasNewJoinRequests = localStorage.getItem('hasNewJoinRequests') === 'true';

            setHasNotification(hasNewMessage || hasNewJoinRequests);
        };

        checkNotifications();

        const handleStorageChange = () => {
            checkNotifications();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
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
