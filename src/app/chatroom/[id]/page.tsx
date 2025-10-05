
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, Timestamp, updateDoc, arrayUnion, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Ban, MessagesSquare, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectChatSidebar } from '@/components/project-chat-sidebar';
import { DmChatSidebar } from '@/components/dm-chat-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ChatHeader } from '@/components/chat-header';
import { JoinRequestCard } from '@/components/join-request-card';
import { useToast } from '@/hooks/use-toast';
import { Linkify } from '@/components/Linkify';
import { useAuth } from '@/components/auth-provider';
import type { AppUser } from '@/types';


interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  senderId: string;
}

interface ChatRoom {
    id: string;
    name: string;
    memberDetails?: { [key: string]: { displayName: string; photoURL: string } };
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

interface JoinRequest {
    id: string;
    userId: string;
    userDisplayName: string | null;
    userPhotoURL: string | null;
    projectCollection: 'projects' | 'privateProjects';
}


function ChatSkeleton() {
    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b">
                 <Skeleton className="h-6 w-1/2" />
            </div>
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
  const { user } = useAuth();
  const chatId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [otherUser, setOtherUser] = useState<AppUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isDmSidebarOpen, setIsDmSidebarOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [isDm, setIsDm] = useState(false);
  const [chatCollection, setChatCollection] = useState<'General' | 'ProjectChats' | null>(null);
  const { toast } = useToast();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const memberCache = useRef<Map<string, Member>>(new Map());

  const fetchProjectAndMembers = useCallback(async () => {
    if (!chatId || !user) return;
    setLoading(true);

    try {
        let chatRoomDoc;
        let chatRoomData;
        let isDmChat = false;

        const generalChatDoc = await getDoc(doc(db, "General", chatId));
        if (generalChatDoc.exists()) {
            chatRoomDoc = generalChatDoc;
            chatRoomData = generalChatDoc.data();
            isDmChat = true;
            setChatCollection('General');
        } else {
            const projectChatDoc = await getDoc(doc(db, "ProjectChats", chatId));
            if (projectChatDoc.exists()) {
                chatRoomDoc = projectChatDoc;
                chatRoomData = projectChatDoc.data();
                isDmChat = false;
                setChatCollection('ProjectChats');
            } else {
                toast({ title: "Chat not found", description: "This chat room no longer exists.", variant: "destructive"});
                router.push('/chatroom');
                setLoading(false);
                return;
            }
        }
        setIsDm(isDmChat);
        setChatRoom({ id: chatRoomDoc.id, ...chatRoomData } as ChatRoom);

        let projDetails: ProjectDetails | null = null;

        if (isDmChat) {
             const otherUserId = chatRoomData.members.find((id: string) => id !== user.id);
             const otherUserData = chatRoomData.memberDetails?.[otherUserId];
             projDetails = {
                id: chatId,
                title: otherUserData?.displayName || 'Direct Message',
                description: 'Direct Message',
                owner: '',
                isPrivate: true,
                admins: [],
                members: chatRoomData.members || [],
             }
            if (otherUserId) {
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                if (userDoc.exists()) {
                    setOtherUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
                }
            }

        } else {
            const publicProjectDoc = await getDoc(doc(db, "projects", chatId));
            const privateProjectDoc = await getDoc(doc(db, "privateProjects", chatId));
            
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
                return;
            }

            const projectData = projectDoc.data();
            projDetails = {
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
        }
        
        setProjectDetails(projDetails);

        if (!projDetails.members?.includes(user.id) && !isDm) {
             setLoading(false);
             return;
        }

        const memberIds = new Set(projDetails?.members);
        if(projDetails?.owner) memberIds.add(projDetails.owner);
        (projDetails?.admins || []).forEach(id => memberIds.add(id));
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
                    isAdmin: projDetails?.admins?.includes(docSnapshot.id) ?? false
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
  }, [chatId, user, router, toast]);


  useEffect(() => {
    fetchProjectAndMembers();
  }, [fetchProjectAndMembers]);
  
  
   useEffect(() => {
        if (!chatId || isDm) {
            setJoinRequests([]);
            return;
        }

        const q = query(
            collection(db, 'joinRequests'),
            where('projectId', '==', chatId),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JoinRequest));
            const isAdmin = user && projectDetails?.admins?.includes(user.id);
            setJoinRequests(requests);
            
            if (requests.length > 0 && isAdmin) {
                localStorage.setItem(`hasNewJoinRequests_${chatId}`, 'true');
            } else {
                localStorage.removeItem(`hasNewJoinRequests_${chatId}`);
            }
            if (isAdmin && requests.length > 0) {
                 localStorage.removeItem(`hasNewJoinRequests_${chatId}`);
            }
            window.dispatchEvent(new Event('storage'));
        }, (error) => {
            console.error("Error fetching join requests:", error);
            toast({ title: "Error", description: "Could not fetch join requests.", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [chatId, toast, isDm, user, projectDetails]);


  useEffect(() => {
    if (!chatId || !chatCollection) return () => {};

    const q = query(collection(db, `${chatCollection}/${chatId}/messages`), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      
      const msgs: Message[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      
      if (msgs.length > 0) {
        const lastMessage = msgs[msgs.length - 1];
        if (lastMessage.createdAt && user) {
            const lastTimestamp = lastMessage.createdAt.toMillis();
            localStorage.setItem(`lastMessageTimestamp_${chatId}`, lastTimestamp.toString());
            localStorage.setItem(`lastMessageSenderId_${chatId}`, lastMessage.senderId);
            window.dispatchEvent(new Event('storage'));

            if(document.hidden && lastMessage.senderId !== user.id) {
                const audio = new Audio('/chatnotify.mp3');
                audio.play().catch(e => console.error("Audio play failed:", e));
            }
        }
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

    return unsubscribe;
  }, [chatId, projectDetails, chatCollection, user]);

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

  useEffect(() => {
      if(chatId) {
          localStorage.setItem(`lastRead_${chatId}`, Date.now().toString());
          window.dispatchEvent(new Event('storage'));
      }
  }, [chatId]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !chatId || !chatCollection || !user) return;

    const userMessage = newMessage;
    setNewMessage('');

    try {
        await addDoc(collection(db, `${chatCollection}/${chatId}/messages`), {
            text: userMessage,
            createdAt: serverTimestamp(),
            senderId: user.id, 
        });
    } catch(error) {
        console.error("Error sending message:", error);
    }
  };
  
  const handleRequestAction = async (requestId: string, userId: string, action: 'approve' | 'decline') => {
        setProcessingRequestId(requestId);

        const requestRef = doc(db, 'joinRequests', requestId);

        try {
            const requestDoc = await getDoc(requestRef);
            if (!requestDoc.exists()) {
                throw new Error("Join request not found.");
            }
            const requestData = requestDoc.data() as JoinRequest;
            const projectCollection = requestData.projectCollection || (projectDetails?.isPrivate ? 'privateProjects' : 'projects');
            const projectRef = doc(db, projectCollection, chatId);

            if (action === 'approve') {
                await updateDoc(projectRef, {
                    members: arrayUnion(userId)
                });
                await updateDoc(requestRef, { status: 'approved' });
                toast({ title: 'User Approved', description: 'The user has been added to the project.' });
            } else {
                await updateDoc(requestRef, { status: 'declined' });
                toast({ title: 'User Declined', description: 'The join request has been declined.' });
            }
            fetchProjectAndMembers();
        } catch(error) {
            console.error(`Error ${action === 'approve' ? 'approving' : 'declining'} request:`, error);
            toast({ title: "Error", description: "Could not process the request.", variant: 'destructive' });
        } finally {
            setProcessingRequestId(null);
        }
    };
  
  
  if (loading) {
    return (
        <div className="h-screen flex flex-col">
            <ChatSkeleton />
        </div>
    );
  }
  
  if (!chatRoom) {
    return <div className="text-center p-8">Chat room not found or you do not have access.</div>
  }

  const getSenderName = (senderId: string) => {
      if (senderId === user?.id) return 'You';
      const member = memberCache.current.get(senderId);
      return member?.displayName || 'A member';
  }
  const getSenderAvatar = (senderId: string) => {
      if (senderId === user?.id) return user.photoURL;
      const member = memberCache.current.get(senderId);
      return member?.photoURL;
  }
  const getSenderFallback = (senderId: string) => {
    if (senderId === user?.id) return getInitials(user.displayName);
    const member = memberCache.current.get(senderId);
    return member?.displayName?.substring(0, 2).toUpperCase() || 'M';
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  function NoChatView() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <MessagesSquare className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Welcome to the chat!</h2>
            <p>No messages here yet. Be the first to start the conversation.</p>
        </div>
    )
  }

  const getPlaceholderText = () => {
    if (!user) return 'You must be logged in to chat';
    return "Type a message...";
  }

  function ChatView() {
    return (
        <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="space-y-4 max-w-4xl mx-auto w-full p-4 pb-24 md:pb-4">
                {messages.length === 0 ? <NoChatView /> : messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === user?.id ? 'justify-end' : ''}`}>
                        {msg.senderId !== user?.id && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={getSenderAvatar(msg.senderId) || undefined} alt="Sender avatar" />
                            <AvatarFallback>{getSenderFallback(msg.senderId)}</AvatarFallback>
                        </Avatar>
                        )}
                        <div className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${msg.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-sm font-medium">{getSenderName(msg.senderId)}</p>
                            <p className="text-sm"><Linkify text={msg.text} /></p>
                        </div>
                        {msg.senderId === user?.id && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={getSenderAvatar(msg.senderId) || undefined} alt="User avatar" />
                            <AvatarFallback>{getSenderFallback(msg.senderId)}</AvatarFallback>
                        </Avatar>
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
  }
  
  const isMember = projectDetails?.members?.includes(user?.id || '') || projectDetails?.owner === user?.id;
  const showJoinRequests = user && projectDetails?.admins?.includes(user.id) && joinRequests.length > 0;
  
  const handleHeaderClick = () => {
    if (isDm) {
      setIsDmSidebarOpen(true);
    } else if (isMember) {
      setIsProjectSidebarOpen(true);
    }
  };

  return (
     <div className="h-screen flex flex-col bg-background">
        {projectDetails && (
            <ChatHeader 
                projectTitle={projectDetails.title}
                onHeaderClick={handleHeaderClick}
                isDm={isDm}
            />
        )}
        
        {showJoinRequests && (
            <JoinRequestCard 
                requests={joinRequests}
                onAction={handleRequestAction}
                processingId={processingRequestId}
            />
        )}
        
        <div className="flex-grow min-h-0">
            {isMember || isDm ? (
                <ChatView />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                    <Ban className="h-12 w-12 mb-4" />
                    <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
                    <p>You must be a member of this project to view the chat.</p>
                     <Button asChild className="mt-4">
                        <Link href={`/projects/${chatId}`}>View Project Details</Link>
                    </Button>
                </div>
            )}
        </div>
        
        {(isMember || isDm) && (
            <div className="p-4 bg-background border-t">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto w-full">
                <div className="relative">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={getPlaceholderText()}
                        className="pr-12"
                        disabled={!user || (!isMember && !isDm)}
                    />
                    <Button type="submit" size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-primary" disabled={newMessage.trim() === '' || !user || (!isMember && !isDm)}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                </form>
            </div>
        )}

        {projectDetails && !isDm && user && (
             <ProjectChatSidebar 
                isOpen={isProjectSidebarOpen} 
                onOpenChange={setIsProjectSidebarOpen}
                project={projectDetails}
                members={members}
                onProjectUpdate={fetchProjectAndMembers}
            />
        )}
        {otherUser && isDm && user && (
            <DmChatSidebar 
                isOpen={isDmSidebarOpen}
                onOpenChange={setIsDmSidebarOpen}
                chatId={chatId}
                otherUser={otherUser}
            />
        )}
     </div>
  );
}
