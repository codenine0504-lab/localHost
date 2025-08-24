
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';


interface ChatRoom {
  id: string;
  name: string;
}

function ChatRoomListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
            ))}
        </div>
    );
}

export default function ChatRoomPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'chatRooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rooms: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
          rooms.push({ 
            id: doc.id, 
            name: doc.data().name,
          });
      });
      setChatRooms(rooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


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
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{room.name}</h3>
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
