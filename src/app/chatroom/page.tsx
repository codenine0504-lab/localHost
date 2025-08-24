
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';


interface ChatRoom {
  id: string;
  name: string;
}

export default function ChatRoomPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'chatRooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rooms: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
      });
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
              className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">{room.name}</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                    Join the conversation for the {room.name} project.
                  </p>
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
