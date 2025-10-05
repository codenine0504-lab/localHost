
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { AnimatedHeader } from '@/components/animated-header';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth-provider';

interface ChatRoom {
  id: string;
  name: string;
  imageUrl?: string;
  hasNotification?: boolean;
}

const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'general', label: 'Direct Messages' },
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
  const { user } = useAuth();
  const [dmRooms, setDmRooms] = useState<ChatRoom[]>([]);
  const [projectRooms, setProjectRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  const checkNotifications = (rooms: ChatRoom[], currentUserId: string | undefined): ChatRoom[] => {
      return rooms.map(room => {
          const lastMessageTimestampStr = localStorage.getItem(`lastMessageTimestamp_${room.id}`);
          const lastReadTimestampStr = localStorage.getItem(`lastRead_${room.id}`);
          const lastMessageSenderId = localStorage.getItem(`lastMessageSenderId_${room.id}`);
          
          const lastMessageTimestamp = lastMessageTimestampStr ? parseInt(lastMessageTimestampStr, 10) : 0;
          const lastReadTimestamp = lastReadTimestampStr ? parseInt(lastReadTimestampStr, 10) : 0;

          return {
              ...room,
              hasNotification: lastMessageTimestamp > 0 && lastMessageTimestamp > lastReadTimestamp && lastMessageSenderId !== currentUserId,
          };
      });
  };

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setDmRooms([]);
        setProjectRooms([]);
        return;
    };
    
    setLoading(true);
    let dmLoaded = false;
    let projectLoaded = false;

    const checkLoadingDone = () => {
        if (dmLoaded && projectLoaded) {
            setLoading(false);
        }
    }

    // Listener for DMs
    const dmQuery = query(collection(db, 'General'), where('members', 'array-contains', user.id));
    const unsubscribeDms = onSnapshot(dmQuery, async (snapshot) => {
        const dms: ChatRoom[] = [];
        for (const roomDoc of snapshot.docs) {
            const roomData = roomDoc.data();
            const otherUserId = roomData.members.find((id: string) => id !== user.id);
            const otherUserData = roomData.memberDetails?.[otherUserId];
            
            if (otherUserData?.displayName) { // Only add DMs with a valid other user
                dms.push({ 
                    id: roomDoc.id, 
                    name: otherUserData.displayName, 
                    imageUrl: otherUserData.photoURL || ''
                });
            }
        }
        setDmRooms(checkNotifications(dms, user.id));
        dmLoaded = true;
        checkLoadingDone();
    }, (error) => {
        console.error("Error fetching DMs:", error);
        dmLoaded = true;
        checkLoadingDone();
    });

    // Listener for Project Chats
    const projectChatQuery = query(collection(db, 'ProjectChats'), where('members', 'array-contains', user.id));
    const unsubscribeProjects = onSnapshot(projectChatQuery, (snapshot) => {
        const projects: ChatRoom[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            projects.push({ id: doc.id, name: data.name, imageUrl: data.imageUrl });
        });
        setProjectRooms(checkNotifications(projects, user.id));
        projectLoaded = true;
        checkLoadingDone();
    }, (error) => {
        console.error("Error fetching project chats:", error);
        projectLoaded = true;
        checkLoadingDone();
    });

    const handleStorageChange = () => {
        if(user) {
            setProjectRooms(prevRooms => checkNotifications(prevRooms, user.id));
            setDmRooms(prevRooms => checkNotifications(prevRooms, user.id));
        }
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeDms();
      unsubscribeProjects();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const renderRoomList = (rooms: ChatRoom[], isDm: boolean) => {
      if (loading) {
          return <ChatRoomListSkeleton />;
      }
      if (!user) {
         return (
            <div className="text-center text-muted-foreground py-10 h-full flex flex-col items-center justify-center">
                  <p>Please log in to see your chats.</p>
              </div>
         )
      }
      if (rooms.length === 0) {
          return (
              <div className="text-center text-muted-foreground py-10 h-full flex flex-col items-center justify-center space-y-4">
                  <ThumbsUp className="h-16 w-16 text-muted-foreground/50" />
                  <div>
                    <p className="font-semibold text-lg">{isDm ? "No direct messages yet." : "You haven't joined any project chats yet."}</p>
                    <p className="text-sm">{isDm ? "Start a conversation from someone's profile." : "Explore projects to join a chat."}</p>
                  </div>
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
                                    fill
                                    style={{objectFit: 'cover'}}
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
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
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
          description="Engage in conversations, both direct and project-specific."
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
            {activeTab === 'general' ? renderRoomList(dmRooms, true) : renderRoomList(projectRooms, false)}
        </div>
    </div>
  );
}

    
