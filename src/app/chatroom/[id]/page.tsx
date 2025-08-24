
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chat } from '@/ai/flows/chat-flow';

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

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId) return;

    // Fetch chat room details
    const getChatRoom = async () => {
        const chatRoomDoc = await getDoc(doc(db, "chatRooms", projectId));
        if (chatRoomDoc.exists()) {
            setChatRoom({ id: chatRoomDoc.id, ...chatRoomDoc.data() } as ChatRoom);
        }
    };
    getChatRoom();


    // Listen for messages
    const q = query(collection(db, `Chat/${projectId}/Chats`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !projectId || isBotReplying) return;

    const userMessage = newMessage;
    setNewMessage('');
    setIsBotReplying(true);

    try {
      await addDoc(collection(db, `Chat/${projectId}/Chats`), {
        text: userMessage,
        createdAt: serverTimestamp(),
        senderId: 'user1', // Replace with dynamic user ID from auth
      });

      const aiResponse = await chat({ message: userMessage });

      await addDoc(collection(db, `Chat/${projectId}/Chats`), {
        text: aiResponse.response,
        createdAt: serverTimestamp(),
        senderId: 'bot', 
      });

    } catch(error) {
        console.error("Error sending message or getting AI response:", error);
    } finally {
        setIsBotReplying(false);
    }
  };
  
  if (!chatRoom) {
    return <div className="text-center p-8">Loading chat...</div>
  }

  return (
    <div className="container mx-auto h-[calc(100vh-150px)] flex flex-col p-4">
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle>{chatRoom?.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <ScrollArea className="flex-grow p-4 border rounded-lg mb-4">
             <div className="space-y-4">
                {loading && <p className="text-center text-muted-foreground">Loading messages...</p>}
                {!loading && messages.length === 0 && (
                   <div className="text-center text-muted-foreground py-10">
                        <p>Welcome to the chat! Be the first to send a message.</p>
                   </div>
                )}
                {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === 'user1' ? 'justify-end' : ''}`}>
                    {msg.senderId !== 'user1' && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/32x32.png" alt="Bot avatar" data-ai-hint="bot avatar" />
                        <AvatarFallback>{msg.senderId.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    )}
                    <div className={`rounded-lg px-4 py-2 max-w-[70%] ${msg.senderId === 'user1' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm">{msg.text}</p>
                    </div>
                     {msg.senderId === 'user1' && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/32x32.png" alt="User avatar" data-ai-hint="user avatar" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    )}
                </div>
                ))}
                {isBotReplying && (
                   <div className="flex items-start gap-3">
                       <Avatar className="h-8 w-8">
                            <AvatarImage src="https://placehold.co/32x32.png" alt="Bot avatar" data-ai-hint="bot avatar" />
                            <AvatarFallback>B</AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg px-4 py-2 max-w-[70%] bg-muted">
                            <p className="text-sm italic">Bot is typing...</p>
                        </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
             </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isBotReplying}
            />
            <Button type="submit" size="icon" disabled={isBotReplying}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
