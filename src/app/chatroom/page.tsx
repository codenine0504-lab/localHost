
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, collectionGroup, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import type { User } from 'firebase/auth';


interface ChatRoom {
  id: string;
  name: string;
  imageUrl?: string;
}

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
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        if (!currentUser) {
            setLoading(false);
            setChatRooms([]);
        }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Clear notification when user visits the main chat page
    localStorage.setItem('lastVisitedChats', Date.now().toString());
    localStorage.removeItem('hasNewJoinRequests');
    window.dispatchEvent(new Event('storage'));

    const fetchUserProjects = async () => {
        setLoading(true);
        try {
            const publicProjectsQuery1 = query(collection(db, 'projects'), where('owner', '==', user.uid));
            const publicProjectsQuery2 = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));
            
            const privateProjectsQuery1 = query(collection(db, 'privateProjects'), where('owner', '==', user.uid));
            const privateProjectsQuery2 = query(collection(db, 'privateProjects'), where('members', 'array-contains', user.uid));

            const [
                publicProjectsSnapshot1,
                publicProjectsSnapshot2,
                privateProjectsSnapshot1,
                privateProjectsSnapshot2
            ] = await Promise.all([
                getDocs(publicProjectsQuery1),
                getDocs(publicProjectsQuery2),
                getDocs(privateProjectsQuery1),
                getDocs(privateProjectsQuery2),
            ]);

            const projectIds = new Set<string>();
            publicProjectsSnapshot1.forEach(doc => projectIds.add(doc.id));
            publicProjectsSnapshot2.forEach(doc => projectIds.add(doc.id));
            privateProjectsSnapshot1.forEach(doc => projectIds.add(doc.id));
            privateProjectsSnapshot2.forEach(doc => projectIds.add(doc.id));

            return Array.from(projectIds);

        } catch (error) {
            console.error("Error fetching user projects:", error);
            return [];
        }
    }

    const setupChatRoomsListener = (projectIds: string[]) => {
        if (projectIds.length === 0) {
            setChatRooms([]);
            setLoading(false);
            return () => {};
        }

        const chatRoomRefs = projectIds.map(id => doc(db, "chatRooms", id));
        
        // Firestore doesn't have a direct `onSnapshot` for multiple documents not in a collection.
        // We set up individual listeners. This is not ideal for a very large number of projects.
        const unsubscribers = chatRoomRefs.map(ref => {
            return onSnapshot(ref, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    const newRoom: ChatRoom = {
                        id: doc.id,
                        name: data.name,
                        imageUrl: data.imageUrl,
                    };

                    setChatRooms(prevRooms => {
                        const existingIndex = prevRooms.findIndex(r => r.id === newRoom.id);
                        if (existingIndex > -1) {
                            // Update existing room
                            const updatedRooms = [...prevRooms];
                            updatedRooms[existingIndex] = newRoom;
                            return updatedRooms;
                        } else {
                            // Add new room
                            return [...prevRooms, newRoom];
                        }
                    });
                }
            });
        });
        
        setLoading(false);

        return () => unsubscribers.forEach(unsub => unsub());
    }

    let unsubscribe = () => {};
    fetchUserProjects().then(projectIds => {
       unsubscribe = setupChatRoomsListener(projectIds);
    });

    return () => unsubscribe();
  }, [user]);


  return (
    <>
      <Header />
      <div className="container mx-auto py-12 px-4 md:px-6">
       <div className="space-y-4">
        {loading ? (
            <ChatRoomListSkeleton />
        ) : chatRooms.length > 0 ? (
          chatRooms.map((room) => (
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
                    <h3 className="text-lg font-semibold truncate">{room.name}</h3>
                </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>You haven&apos;t joined any projects yet. Find a project to start chatting!</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
