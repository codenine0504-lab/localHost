
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import Image from 'next/image';

interface ChatRoom {
  id: string;
  name: string;
  imageUrl?: string;
}

export default function ChatRoomPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'chatRooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const rooms: ChatRoom[] = [];
      const projectIds = querySnapshot.docs.map(doc => doc.id);

      if (projectIds.length > 0) {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projectsData = new Map(projectsSnapshot.docs.map(doc => [doc.id, doc.data()]));

        querySnapshot.forEach((doc) => {
            const projectData = projectsData.get(doc.id);
            rooms.push({ 
            id: doc.id, 
            name: doc.data().name,
            imageUrl: projectData?.imageUrl,
            });
        });
      }
      
      setChatRooms(rooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <p>Loading chat rooms...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-12 px-4 md:px-6">
       <div className="space-y-4">
        {chatRooms.length > 0 ? (
          chatRooms.map((room) => (
            <Link
                href={`/chatroom/${room.id}`}
                key={room.id}
                className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer glow-border-hover bg-background"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            <Image
                                src={room.imageUrl || 'https://placehold.co/40x40.png'}
                                alt={`Image for ${room.name}`}
                                fill
                                objectFit="cover"
                                data-ai-hint="project image"
                            />
                        </div>
                        <h3 className="text-lg font-semibold">{room.name}</h3>
                    </div>
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>No chat rooms available yet. Host a project to start a new chat!</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
