
'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, addDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MessageSquare, Send } from 'lucide-react';
import type { User } from 'firebase/auth';
import { AnimatedHeader } from '@/components/animated-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  senderId: string;
}

interface Member {
    id: string;
    displayName: string | null;
    photoURL: string | null;
}

interface ChatRoom {
  id: string;
  name: string;
  imageUrl?: string;
  hasNotification?: boolean;
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

function GeneralChat() {
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const memberCache = useRef<Map<string, Member>>(new Map());

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    };

    useEffect(() => {
        const q = query(collection(db, "chatRooms/general/messages"), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const msgs: Message[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
            setLoading(false);
            scrollToBottom();

            const senderIds = new Set(msgs.map(msg => msg.senderId));
            const newSenderIds = Array.from(senderIds).filter(id => !memberCache.current.has(id));

            if (newSenderIds.length > 0) {
                const fetchPromises = newSenderIds.map(id => getDoc(doc(db, 'users', id)));
                const userDocs = await Promise.all(fetchPromises);

                userDocs.forEach(docSnapshot => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        const newMember = {
                            id: docSnapshot.id,
                            displayName: userData?.displayName || 'Unknown User',
                            photoURL: userData?.photoURL || null,
                        };
                        memberCache.current.set(docSnapshot.id, newMember);
                    }
                });
                // Force re-render if needed, though message update should do it
                 setMessages(currentMessages => [...currentMessages]);
            }
        }, (error) => {
            console.error("Error fetching general chat:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

     useEffect(() => {
        scrollToBottom();
     }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || user.isAnonymous) return;

        const userMessage = newMessage;
        setNewMessage('');

        try {
            await addDoc(collection(db, "chatRooms/general/messages"), {
                text: userMessage,
                createdAt: serverTimestamp(),
                senderId: user.uid,
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getSenderName = (senderId: string) => {
        if (senderId === user?.uid) return 'You';
        const member = memberCache.current.get(senderId);
        return member?.displayName || 'A member';
    };

    const getSenderAvatar = (senderId: string) => {
        const member = memberCache.current.get(senderId);
        return member?.photoURL;
    };

    const getSenderFallback = (senderId: string) => {
        if (senderId === user?.uid) return user.displayName?.substring(0, 2).toUpperCase() || 'U';
        const member = memberCache.current.get(senderId);
        return member?.displayName?.substring(0, 2).toUpperCase() || 'M';
    };
    
    const getPlaceholderText = () => {
        if (user?.isAnonymous) {
            return "Login to send messages";
        }
        return "Type a message...";
    };

    return (
        <div className="h-full flex flex-col">
            <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
                <div className="space-y-4 max-w-4xl mx-auto w-full p-4">
                    {loading ? (
                         <div className="flex items-center justify-center h-full text-muted-foreground">Loading chat...</div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No messages yet. Say hi!</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
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
                        ))
                    )}
                </div>
            </ScrollArea>
            <div className={cn("p-4 bg-background border-t")}>
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto w-full">
                <div className="relative">
                    {user?.isAnonymous ? (
                        <Link href="/login" className="block">
                            <div className="relative">
                                <Input placeholder={getPlaceholderText()} disabled={true} className="pr-12" />
                                <div className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer" />
                            </div>
                        </Link>
                    ) : (
                        <>
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={getPlaceholderText()}
                                disabled={!user}
                                className="pr-12"
                            />
                            <Button type="submit" size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-primary" disabled={newMessage.trim() === '' || !user}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
                </form>
            </div>
        </div>
    )
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

  const checkNotifications = (rooms: ChatRoom[]): ChatRoom[] => {
      return rooms.map(room => {
          if (room.id === 'general') {
               const lastGeneralMessageTimestampStr = localStorage.getItem(`lastMessageTimestamp_general`);
               const lastGeneralReadTimestampStr = localStorage.getItem(`lastRead_general`);
               const lastGeneralMessageTimestamp = lastGeneralMessageTimestampStr ? parseInt(lastGeneralMessageTimestampStr, 10) : 0;
               const lastGeneralReadTimestamp = lastGeneralReadTimestampStr ? parseInt(lastGeneralReadTimestampStr, 10) : Date.now();
               return {...room, hasNotification: lastGeneralMessageTimestamp > lastGeneralReadTimestamp };
          }

          const lastMessageTimestampStr = localStorage.getItem(`lastMessageTimestamp_${room.id}`);
          const lastReadTimestampStr = localStorage.getItem(`lastRead_${room.id}`);
          const lastMessageTimestamp = lastMessageTimestampStr ? parseInt(lastMessageTimestampStr, 10) : 0;
          const lastReadTimestamp = lastReadTimestampStr ? parseInt(lastReadTimestampStr, 10) : Date.now();

          return {
              ...room,
              hasNotification: lastMessageTimestamp > lastReadTimestamp
          };
      });
  };

  useEffect(() => {
    if (!user) return;

    // Clear user-specific join request flag when visiting the chat list
    const joinRequestKey = `hasNewJoinRequests_${user.uid}`;
    localStorage.removeItem(joinRequestKey);
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
                        let updatedRooms: ChatRoom[];
                        const existingIndex = prevRooms.findIndex(r => r.id === newRoom.id);
                        if (existingIndex > -1) {
                            const updatedRoom = { ...prevRooms[existingIndex], ...newRoom };
                            updatedRooms = [...prevRooms];
                            updatedRooms[existingIndex] = updatedRoom;
                        } else {
                            updatedRooms = [...prevRooms, newRoom];
                        }
                        return checkNotifications(updatedRooms);
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

    const handleStorageChange = () => {
        setChatRooms(prevRooms => checkNotifications(prevRooms));
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);


  return (
    <div className="container mx-auto py-12 px-4 md:px-6 flex flex-col h-screen">
      <AnimatedHeader 
          title="Your Chats"
          description="Engage in conversations, both public and project-specific."
      />
      <Tabs defaultValue="projects" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="flex-1">
              <GeneralChat />
          </TabsContent>
          <TabsContent value="projects" className="flex-1">
              <div className="space-y-4 h-full overflow-y-auto">
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
                              <h3 className="text-lg font-semibold truncate flex-1">{room.name}</h3>
                              {room.hasNotification && (
                                  <div className="h-3 w-3 relative">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                  </div>
                              )}
                          </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-10 h-full flex flex-col items-center justify-center">
                      <p>You haven't joined any projects yet. Find a project to start chatting!</p>
                    </div>
                  )}
              </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}
