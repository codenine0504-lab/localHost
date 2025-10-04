
'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import type { User } from 'firebase/auth';
import { AnimatedHeader } from '@/components/animated-header';
import { motion } from 'framer-motion';

interface ChatRoom {
  id: string;
  name: string;
  imageUrl?: string;
  hasNotification?: boolean;
  isDm?: boolean;
}

const tabs = [
    { id: 'dms', label: 'General' },
    { id: 'projects', label: 'Projects' },
];

function ChatRoomListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
            ))}
        </div>
    );
}

export default function ChatRoomPage() {
  const [user, setUser] = useState<User | null>(null);
  const [dmRooms, setDmRooms] = useState<ChatRoom[]>([]);
  const [projectRooms, setProjectRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        if (!currentUser) {
            setLoading(false);
            setProjectRooms([]);
            setDmRooms([]);
        }
    });
    return () => unsubscribeAuth();
  }, []);

  const checkNotifications = (rooms: ChatRoom[]): ChatRoom[] => {
      return rooms.map(room => {
          const lastMessageTimestampStr = localStorage.getItem(`lastMessageTimestamp_${room.id}`);
          const lastReadTimestampStr = localStorage.getItem(`lastRead_${room.id}`);
          
          const lastMessageTimestamp = lastMessageTimestampStr ? parseInt(lastMessageTimestampStr, 10) : 0;
          const lastReadTimestamp = lastReadTimestampStr ? parseInt(lastReadTimestampStr, 10) : 0;

          return {
              ...room,
              hasNotification: lastMessageTimestamp > 0 && lastMessageTimestamp > lastReadTimestamp
          };
      });
  };

  useEffect(() => {
    if (!user) return;

    const joinRequestKey = `hasNewJoinRequests_${user.uid}`;
    localStorage.removeItem(joinRequestKey);
    window.dispatchEvent(new Event('storage'));

    const projectQuery = query(collection(db, 'chatRooms'), where('members', 'array-contains', user.uid), where('isDm', '==', false));
    const dmQuery = query(collection(db, 'chatRooms'), where('members', 'array-contains', user.uid), where('isDm', '==', true));

    setLoading(true);

    const unsubProjects = onSnapshot(projectQuery, (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
        setProjectRooms(checkNotifications(rooms));
        setLoading(false);
    });

    const unsubDms = onSnapshot(dmQuery, async (snapshot) => {
        const rooms: ChatRoom[] = [];
        for (const docSnap of snapshot.docs) {
            const roomData = docSnap.data();
            const otherMemberId = roomData.members.find((id: string) => id !== user.uid);
            let otherMemberName = 'Direct Message';
            let otherMemberPhoto = '';

            if (otherMemberId) {
                const userDoc = await getDoc(doc(db, 'users', otherMemberId));
                if (userDoc.exists()) {
                    otherMemberName = userDoc.data().displayName || otherMemberName;
                    otherMemberPhoto = userDoc.data().photoURL || otherMemberPhoto;
                }
            }

            rooms.push({ 
                id: docSnap.id, 
                name: otherMemberName, 
                imageUrl: otherMemberPhoto,
                ...roomData 
            } as ChatRoom);
        }
        setDmRooms(checkNotifications(rooms));
        setLoading(false);
    });

    const handleStorageChange = () => {
        setProjectRooms(prevRooms => checkNotifications(prevRooms));
        setDmRooms(prevRooms => checkNotifications(prevRooms));
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubProjects();
      unsubDms();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const renderRoomList = (rooms: ChatRoom[], isDm: boolean) => {
      if (loading) {
          return <ChatRoomListSkeleton />;
      }
      if (rooms.length === 0) {
          return (
              <div className="text-center text-muted-foreground py-10 h-full flex flex-col items-center justify-center">
                  <p>{isDm ? "You have no direct messages." : "You haven't joined any projects yet."}</p>
              </div>
          );
      }
      return (
           <div className="space-y-4 h-full overflow-y-auto">
              {rooms.map((room) => (
                <Link
                    href={`/chatroom/${room.id}`}
                    key={room.id}
                    className="block p-4 border rounded-lg hover:bg-muted/50 transition-all duration-300 cursor-pointer bg-background hover:shadow-primary/20 hover:shadow-[0_0_15px] focus:shadow-primary/20 focus:shadow-[0_0_15px] focus:outline-none"
                >
                    <div className="flex items-center gap-4">
                        {room.imageUrl ? (
                            <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                                <Image
                                    src={room.imageUrl}
                                    alt={`${room.name} icon`}
                                    layout="fill"
                                    objectFit="cover"
                                    data-ai-hint="chatroom icon"
                                />
                            </div>
                        ) : (
                                <div className="flex h-10 w-10 rounded-full bg-muted items-center justify-center flex-shrink-0">
                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                        <h3 className="text-lg font-semibold truncate flex-1">{room.name}</h3>
                        {room.hasNotification && (
                            <div className="h-3 w-3 relative">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </div>
                        )}
                    </div>
                </Link>
              ))}
          </div>
      );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 flex flex-col h-screen">
      <AnimatedHeader 
          title="Your Chats"
          description="Engage in conversations, both public and project-specific."
      />
        <div className="flex justify-center mb-8">
             <div className="flex space-x-1 rounded-full bg-muted p-1">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                    activeTab === tab.id ? '' : 'hover:text-foreground/60'
                    } relative rounded-full px-4 py-2 text-sm font-medium text-foreground transition focus-visible:outline-2`}
                    style={{
                    WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {activeTab === tab.id && (
                    <motion.span
                        layoutId="bubble"
                        className="absolute inset-0 z-10 bg-blue-600"
                        style={{ borderRadius: 9999 }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                    )}
                    <span className={`relative z-20 ${activeTab === tab.id ? 'text-white' : ''}`}>{tab.label}</span>
                </button>
                ))}
            </div>
        </div>
      
        <div className="flex-1 min-h-0">
            {activeTab === 'dms' ? renderRoomList(dmRooms, true) : renderRoomList(projectRooms, false)}
        </div>
    </div>
  );
}
