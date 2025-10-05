
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth-provider';
import { useUserLastRead } from '@/hooks/use-user-last-read';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useJoinRequests } from '@/hooks/use-join-requests';

interface NotificationBadgeProps {
    children: React.ReactNode;
}

interface ChatRoom {
  id: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageSenderId?: string;
}

export function NotificationBadge({ children }: NotificationBadgeProps) {
    const { user } = useAuth();
    const { lastRead, loading: lastReadLoading } = useUserLastRead(user?.id);
    const { requests: joinRequests, loading: requestsLoading } = useJoinRequests(user?.id);
    const [hasChatNotification, setHasChatNotification] = useState(false);
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

    useEffect(() => {
        if (!user) {
            setHasChatNotification(false);
            setChatRooms([]);
            return;
        }

        const collectionsToQuery = ['General', 'ProjectChats'];
        const unsubscribes = collectionsToQuery.map(coll => {
            const q = query(collection(db, coll), where('members', 'array-contains', user.id));
            return onSnapshot(q, (snapshot) => {
                const rooms = snapshot.docs.map(doc => ({
                    id: doc.id,
                    lastMessageTimestamp: doc.data().lastMessageTimestamp,
                    lastMessageSenderId: doc.data().lastMessageSenderId
                }));

                setChatRooms(prev => {
                    const otherRooms = prev.filter(r => !rooms.some(nr => nr.id === r.id));
                    return [...otherRooms, ...rooms];
                });
            });
        });
        
        return () => unsubscribes.forEach(unsub => unsub());

    }, [user]);

    useEffect(() => {
        if (!user || lastReadLoading || chatRooms.length === 0) {
            setHasChatNotification(false);
            return;
        }

        let notificationFound = false;
        for (const room of chatRooms) {
            const lastReadTimestamp = lastRead[room.id]?.toMillis() || 0;
            const lastMessageTimestamp = room.lastMessageTimestamp?.toMillis() || 0;

            if (lastMessageTimestamp > lastReadTimestamp && room.lastMessageSenderId !== user.id) {
                notificationFound = true;
                break;
            }
        }
        setHasChatNotification(notificationFound);

    }, [user, lastRead, lastReadLoading, chatRooms]);

    const hasJoinRequestNotification = !requestsLoading && joinRequests.length > 0;
    const hasNotification = hasChatNotification || hasJoinRequestNotification;

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
