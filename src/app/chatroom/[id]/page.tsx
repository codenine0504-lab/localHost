
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSidebar } from '@/components/chat-sidebar';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  text: string;
  createdAt: any;
  senderId: string;
}

interface ChatRoom {
    id: string;
    name: string;
}

interface ProjectDetails {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    owner: string;
    isPrivate: boolean;
}

interface Member {
    id: string;
    displayName: string | null;
    photoURL: string | null;
    isAdmin: boolean;
}

function ChatSkeleton() {
    return (
        <div className="flex flex-col h-[calc(100vh_-_65px)] bg-background">
            <div className="flex-grow p-4 space-y-6 max-w-4xl mx-auto w-full">
                <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-48" />
                    </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-6 w-40 ml-auto" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                         <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>
            </div>
            <div className="p-4 bg-background border-t">
                 <div className="relative max-w-4xl mx-auto w-full">
                     <Skeleton className="h-10 w-full rounded-md" />
                 </div>
            </div>
        </div>
    )
}

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const memberCache = useRef<Map<string, Member>>(new Map());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const fetchProjectAndMembers = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    try {
        // Check both collections for the project
        const publicProjectDoc = await getDoc(doc(db, "projects", projectId));
        const privateProjectDoc = await getDoc(doc(db, "privateProjects", projectId));
        
        let projectDoc;
        let isPrivate = false;

        if (publicProjectDoc.exists()) {
            projectDoc = publicProjectDoc;
            isPrivate = false;
        } else if (privateProjectDoc.exists()) {
            projectDoc = privateProjectDoc;
            isPrivate = true;
        }

        if (projectDoc?.exists()) {
            const projectData = projectDoc.data();
            const projDetails = {
                id: projectDoc.id,
                title: projectData.title,
                description: projectData.description,
                imageUrl: projectData.imageUrl,
                owner: projectData.owner,
                isPrivate: isPrivate
            };
            setProjectDetails(projDetails);
        }

        const chatRoomDoc = await getDoc(doc(db, "chatRooms", projectId));
        if (chatRoomDoc.exists()) {
            setChatRoom({ id: chatRoomDoc.id, ...chatRoomDoc.data() } as ChatRoom);
        }
    } catch(error) {
        console.error("Error fetching project details:", error);
    } finally {
        setLoading(false);
    }
  }, [projectId]);


  useEffect(() => {
    fetchProjectAndMembers();
  }, [fetchProjectAndMembers]);


  useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, `Chat/${projectId}/Chats`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const msgs: Message[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);

      const senderIds = new Set(msgs.map(msg => msg.senderId).filter(id => id !== 'bot'));
      if (projectDetails) {
          senderIds.add(projectDetails.owner);
      }
      
      const newSenderIds = Array.from(senderIds).filter(id => !memberCache.current.has(id));

      if (newSenderIds.length > 0) {
        const fetchPromises = newSenderIds.map(id => getDoc(doc(db, 'users', id)));
        const userDocs = await Promise.all(fetchPromises);

        userDocs.forEach(docSnapshot => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                memberCache.current.set(docSnapshot.id, {
                    id: docSnapshot.id,
                    displayName: userData?.displayName || 'Unknown User',
                    photoURL: userData?.photoURL || null,
                    isAdmin: docSnapshot.id === projectDetails?.owner
                });
            }
        });
        setMembers(Array.from(memberCache.current.values()));
      }
      
      if (loading) {
          setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [projectId, projectDetails, loading]);

  const scrollToBottom = () => {
     if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !projectId || !user) return;

    const userMessage = newMessage;
    setNewMessage('');

    try {
        await addDoc(collection(db, `Chat/${projectId}/Chats`), {
            text: userMessage,
            createdAt: serverTimestamp(),
            senderId: user.uid, 
        });
    } catch(error) {
        console.error("Error sending message:", error);
    }
  };
  
  if (loading) {
    return (
        <>
            <Header />
            <ChatSkeleton />
        </>
    );
  }
  
  if (!chatRoom) {
    return <div className="text-center p-8">Chat room not found.</div>
  }

  const getSenderName = (senderId: string) => {
      if (senderId === 'bot') return 'Bot';
      if (senderId === user?.uid) return 'You';
      const member = memberCache.current.get(senderId);
      return member?.displayName || 'A member';
  }
  const getSenderAvatar = (senderId: string) => {
      if(senderId === 'bot') return "https://placehold.co/32x32.png";
      const member = memberCache.current.get(senderId);
      return member?.photoURL;
  }
  const getSenderFallback = (senderId: string) => {
    if(senderId === 'bot') return 'BT';
    if (senderId === user?.uid) return user.displayName?.substring(0, 2).toUpperCase() || 'U';
    const member = memberCache.current.get(senderId);
    return member?.displayName?.substring(0, 2).toUpperCase() || 'M';
  };

  return (
     <>
        <Header onTitleClick={() => setIsSidebarOpen(true)} />
        <div className="flex flex-col h-[calc(100vh_-_65px)] bg-background">
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className="space-y-4 max-w-4xl mx-auto w-full">
                {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                        <p>Discuss Your project here</p>
                </div>
                )}
                {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === user?.uid ? 'justify-end' : ''}`}>
                    {msg.senderId !== user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={getSenderAvatar(msg.senderId) || undefined} alt="Sender avatar" />
                        <AvatarFallback>{getSenderFallback(msg.senderId)}</AvatarFallback>
                    </Avatar>
                    )}
                    <div className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm font-medium">{getSenderName(msg.senderId)}</p>
                    <p className="text-sm">{msg.text}</p>
                    </div>
                    {msg.senderId === user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={getSenderAvatar(msg.senderId) || undefined} alt="User avatar" />
                        <AvatarFallback>{getSenderFallback(msg.senderId)}</AvatarFallback>
                    </Avatar>
                    )}
                </div>
                ))}
            </div>
        </ScrollArea>
        <div className="p-4 bg-background border-t">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto w-full">
            <div className="relative">
                <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!user}
                className="pr-12"
                />
                <Button type="submit" size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-primary" disabled={newMessage.trim() === '' || !user}>
                <Send className="h-4 w-4" />
                </Button>
            </div>
            </form>
        </div>
        </div>
        {projectDetails && (
             <ChatSidebar 
                isOpen={isSidebarOpen} 
                onOpenChange={setIsSidebarOpen}
                project={projectDetails}
                members={members}
                currentUser={user}
                onProjectUpdate={fetchProjectAndMembers}
            />
        )}
     </>
  );
}
