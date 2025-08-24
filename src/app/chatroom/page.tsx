
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';


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
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'chatRooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rooms: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
          const data = doc.data();
          rooms.push({ 
            id: doc.id, 
            name: data.name,
            imageUrl: data.imageUrl,
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
            <p>No chat rooms available yet. Host a project to start a new chat!</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
