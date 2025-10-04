
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram, Github, Linkedin, Link as LinkIcon, MessageSquare, Briefcase, School } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import type { AppUser } from '@/types';
import Link from 'next/link';

interface UserProfileCardProps {
  user: AppUser;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileCard({ user, isOpen, onOpenChange }: UserProfileCardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setCurrentUser);
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async () => {
    if (!currentUser || !user || currentUser.uid === user.id) return;

    if (currentUser.isAnonymous) {
        toast({
            title: "Authentication Required",
            description: "Please create an account to message other users.",
            action: <Button onClick={() => router.push('/login')}>Login</Button>,
            variant: "destructive"
        });
        return;
    }

    const chatRoomId = [currentUser.uid, user.id].sort().join('_');
    const chatRoomRef = doc(db, 'General', chatRoomId);
    
    try {
        const chatRoomDoc = await getDoc(chatRoomRef);

        if (!chatRoomDoc.exists()) {
            const batch = writeBatch(db);
            
            batch.set(chatRoomRef, {
                members: [currentUser.uid, user.id],
                createdAt: serverTimestamp(),
            });

            await batch.commit();
        }

        router.push(`/chatroom/${chatRoomId}`);
    } catch (error) {
        console.error("Error creating or navigating to DM chat room:", error);
        toast({
            title: "Error",
            description: "Could not start a conversation. Please try again.",
            variant: "destructive",
        })
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const socialLinks = [
    { platform: 'github', value: user.github, icon: Github, urlPrefix: 'https://github.com/' },
    { platform: 'linkedin', value: user.linkedin, icon: Linkedin, urlPrefix: '' },
    { platform: 'instagram', value: user.instagram, icon: Instagram, urlPrefix: 'https://instagram.com/' },
    { platform: 'otherLink', value: user.otherLink, icon: LinkIcon, urlPrefix: '' },
  ].filter(link => link.value);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0">
         <div className="relative">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-primary/20 to-accent/20" />
            <div className="relative flex flex-col items-center pt-10 pb-6 px-6 text-center">
                 <Avatar className="h-24 w-24 border-4 border-background shadow-lg -mt-2">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <DialogHeader className="mt-4">
                    <DialogTitle className="text-2xl font-bold">{user.displayName}</DialogTitle>
                </DialogHeader>
                {user.status && user.status !== 'none' && (
                    <Badge variant={user.status === 'seeking' ? 'default' : 'secondary'} className="mt-2">
                        {user.status === 'seeking' ? 'Seeking Collaboration' : 'Actively Building'}
                    </Badge>
                )}
                 {currentUser?.uid !== user.id && (
                    <Button className="mt-4 w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white" onClick={handleSendMessage}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Button>
                )}
                 {socialLinks.length > 0 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                        {socialLinks.map(link => (
                            <Link key={link.platform} href={`${link.urlPrefix}${link.value}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                <link.icon className="h-5 w-5" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-6 pb-6 space-y-4">
                 <div>
                    <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground mb-2"><Briefcase className="h-4 w-4" /> Skills</h4>
                    {user.skills && user.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {user.skills.map(skill => (
                                <Badge key={skill.name} variant={skill.isPrimary ? 'default' : 'secondary'}>
                                    {skill.name}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No skills listed yet.</p>
                    )}
                 </div>
                 <div>
                    <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground mb-2"><School className="h-4 w-4" /> Education</h4>
                     {user.college ? (
                        <p className="text-sm">{user.college}</p>
                    ) : (
                            <p className="text-sm text-muted-foreground">No college information provided.</p>
                    )}
                 </div>
            </div>
             <div className="px-6 pb-6 text-center">
                 <Button variant="link" asChild>
                     <Link href={`/profile/${user.id}`}>View Full Profile</Link>
                 </Button>
            </div>
         </div>
      </DialogContent>
    </Dialog>
  );
}
