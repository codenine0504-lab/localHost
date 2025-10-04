
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Ban } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSidebar } from '@/components/chat-sidebar';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
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
    members?: string[];
    admins?: string[];
    requiresRequestToJoin?: boolean;
}

interface Member {
    id: string;
    displayName: string | null;
    photoURL: string | null;
    isAdmin: boolean;
}

function ChatSkeleton() {
    return (
        <div className="flex flex-col h-full bg-background">
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
  const router = useRouter();
  const projectId = params.id as string;
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const memberCache = useRef<Map<string, Member>>(new Map());
  const initialLoadHandled = useRef(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        if (!currentUser) {
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);
  
  // Mark chat as read when component mounts
  useEffect(() => {
    if(projectId) {
        localStorage.setItem(`lastRead_${projectId}`, Date.now().toString());
        window.dispatchEvent(new Event('storage')); // Notify other components
    }
  }, [projectId]);

  const fetchProjectAndMembers = useCallback(async () => {
    if (!projectId || !user) return;
    setLoading(true);

    try {
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
        } else {
             setLoading(false);
             setHasAccess(false);
             return;
        }

        const projectData = projectDoc.data();
        const projDetails: ProjectDetails = {
            id: projectDoc.id,
            title: projectData.title,
            description: projectData.description,
            imageUrl: projectData.imageUrl,
            owner: projectData.owner,
            isPrivate: isPrivate,
            members: projectData.members || [],
            admins: projectData.admins || [projectData.owner],
            requiresRequestToJoin: projectData.requiresRequestToJoin,
        };
        setProjectDetails(projDetails);

        // Access control
        const canView = !isPrivate || projDetails.admins?.includes(user.uid) || (projDetails.members && projDetails.members.includes(user.uid));
        setHasAccess(canView);

        if(!canView) {
            setLoading(false);
            return;
        }

        const chatRoomDoc = await getDoc(doc(db, "chatRooms", projectId));
        if (chatRoomDoc.exists()) {
            setChatRoom({ id: chatRoomDoc.id, ...chatRoomDoc.data() } as ChatRoom);
        }

        // Fetch member details
        const memberIds = new Set(projDetails.members);
        memberIds.add(projDetails.owner);
        const uniqueMemberIds = Array.from(memberIds);
        
        const fetchPromises = uniqueMemberIds.map(id => getDoc(doc(db, 'users', id)));
        const userDocs = await Promise.all(fetchPromises);

        const fetchedMembers: Member[] = [];
        userDocs.forEach(docSnapshot => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const member = {
                    id: docSnapshot.id,
                    displayName: userData?.displayName || 'Unknown User',
                    photoURL: userData?.photoURL || null,
                    isAdmin: projDetails.admins?.includes(docSnapshot.id) ?? false
                };
                fetchedMembers.push(member);
                memberCache.current.set(docSnapshot.id, member);
            }
        });
        setMembers(fetchedMembers);

    } catch(error) {
        console.error("Error fetching project details:", error);
    } finally {
        setLoading(false);
    }
  }, [projectId, user]);


  useEffect(() => {
    if (user) {
        fetchProjectAndMembers();
    }
  }, [user, fetchProjectAndMembers]);


  useEffect(() => {
    if (!projectId || !hasAccess || !user) return;

    const q = query(collection(db, `Chat/${projectId}/Chats`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const msgs: Message[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);

      if (initialLoadHandled.current && msgs.length > 0) {
        const lastMessage = msgs[msgs.length - 1];
        if (lastMessage.senderId !== user.uid) {
            // Update localStorage with the timestamp of the last message for this specific chat
            const lastTimestamp = lastMessage.createdAt.toMillis();
            localStorage.setItem(`lastMessageTimestamp_${projectId}`, lastTimestamp.toString());
            window.dispatchEvent(new Event('storage')); // Notify other components

            if(document.hidden) {
                const audio = new Audio('/chatnotify.mp3');
                audio.play().catch(e => console.error("Audio play failed:", e));
            }
        }
      }
      
      if(!initialLoadHandled.current && msgs.length > 0) {
          initialLoadHandled.current = true;
      }

      const senderIds = new Set(msgs.map(msg => msg.senderId));
      const newSenderIds = Array.from(senderIds).filter(id => !memberCache.current.has(id));

      if (newSenderIds.length > 0) {
        const fetchPromises = newSenderIds.map(id => getDoc(doc(db, 'users', id)));
        const userDocs = await Promise.all(fetchPromises);
        const currentMembers = Array.from(memberCache.current.values());

        userDocs.forEach(docSnapshot => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const newMember = {
                    id: docSnapshot.id,
                    displayName: userData?.displayName || 'Unknown User',
                    photoURL: userData?.photoURL || null,
                    isAdmin: projectDetails?.admins?.includes(docSnapshot.id) ?? false,
                };
                memberCache.current.set(docSnapshot.id, newMember);
                currentMembers.push(newMember);
            }
        });
        setMembers(currentMembers);
      }
    });

    return () => unsubscribe();
  }, [projectId, hasAccess, user, projectDetails]);

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
        <div className="h-screen flex flex-col">
            
            <ChatSkeleton />
        </div>
    );
  }
  
  if (!user) {
     router.push('/projects');
     return null;
  }
  
  if (!hasAccess) {
    return (
      <>
        
        <div className="flex flex-col items-center justify-center h-[calc(100vh_-_65px)] text-center p-4">
            <Ban className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground max-w-md">You do not have permission to view this chat. If this is a private project, ask the admin for an invitation.</p>
            <Button onClick={() => router.push('/projects')} className="mt-6">Back to Projects</Button>
        </div>
      </>
    )
  }
  
  if (!chatRoom) {
    return <div className="text-center p-8">Chat room not found.</div>
  }

  const getSenderName = (senderId: string) => {
      if (senderId === user?.uid) return 'You';
      const member = memberCache.current.get(senderId);
      return member?.displayName || 'A member';
  }
  const getSenderAvatar = (senderId: string) => {
      const member = memberCache.current.get(senderId);
      return member?.photoURL;
  }
  const getSenderFallback = (senderId: string) => {
    if (senderId === user?.uid) return user.displayName?.substring(0, 2).toUpperCase() || 'U';
    const member = memberCache.current.get(senderId);
    return member?.displayName?.substring(0, 2).toUpperCase() || 'M';
  };

  return (
     <div className="h-screen flex flex-col bg-background">
        
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
            <div className="space-y-4 max-w-4xl mx-auto w-full p-4 pb-24 md:pb-4">
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:relative">
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
     </div>
  );
}

    
