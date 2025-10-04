
'use client';

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from 'firebase/auth';
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedHeader } from "@/components/animated-header";
import { Instagram, Github, Linkedin, Link as LinkIcon, Briefcase, School, MessageSquare } from "lucide-react";
import { useRouter, useParams } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import type { AppUser } from '@/types';
import { useToast } from "@/hooks/use-toast";


function ProfileSkeleton() {
    return (
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 p-6 bg-transparent relative z-10">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-2">
                        <Skeleton className="h-9 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>User's skills and interests.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function PublicProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.id as string;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setCurrentUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
          setLoading(false);
          return;
      };

      setLoading(true);
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setProfileUser({ id: userDoc.id, ...userDoc.data() } as AppUser);
      } else {
        // Handle user not found
      }
      setLoading(false);
    };

    fetchUser();
  }, [userId]);

  const handleSendMessage = async () => {
    if (!currentUser || !profileUser || currentUser.uid === profileUser.id) return;

    if (currentUser.isAnonymous) {
        toast({
            title: "Authentication Required",
            description: "Please create an account to message other users.",
            action: <Button onClick={() => router.push('/login')}>Login</Button>,
            variant: "destructive"
        });
        return;
    }

    const chatRoomId = [currentUser.uid, profileUser.id].sort().join('_');
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    
    try {
        const chatRoomDoc = await getDoc(chatRoomRef);

        if (!chatRoomDoc.exists()) {
             const batch = writeBatch(db);
             
             batch.set(chatRoomRef, {
                isDm: true,
                members: [currentUser.uid, profileUser.id],
                createdAt: serverTimestamp(),
            });
            
            const messagesCollectionRef = doc(collection(chatRoomRef, 'messages'));
            batch.set(messagesCollectionRef, {});

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

  if (loading) {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <AnimatedHeader title="Loading Profile" description="Please wait..." />
            <ProfileSkeleton />
        </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <AnimatedHeader title="User Not Found" description="This profile does not exist or could not be loaded." />
        <Button onClick={() => router.push('/people')}>Back to People</Button>
      </div>
    );
  }

  const socialLinks = [
    { platform: 'github', value: profileUser.github, icon: Github, urlPrefix: 'https://github.com/' },
    { platform: 'linkedin', value: profileUser.linkedin, icon: Linkedin, urlPrefix: '' },
    { platform: 'instagram', value: profileUser.instagram, icon: Instagram, urlPrefix: 'https://instagram.com/' },
    { platform: 'otherLink', value: profileUser.otherLink, icon: LinkIcon, urlPrefix: '' },
  ].filter(link => link.value);

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
        <AnimatedHeader title={profileUser.displayName || 'User Profile'} description={profileUser.college || 'Discover this user\'s profile'} />
        
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
                <Card className="overflow-hidden relative">
                     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-accent/20" />
                    <CardHeader className="flex flex-col items-center text-center gap-4 p-6 bg-transparent relative z-10">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                            <AvatarImage src={profileUser.photoURL || undefined} alt="User avatar" />
                            <AvatarFallback>{getInitials(profileUser.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <CardTitle className="text-xl break-all">{profileUser.displayName}</CardTitle>
                            {profileUser.status && profileUser.status !== 'none' && (
                                <Badge variant={profileUser.status === 'seeking' ? 'default' : 'secondary'} className="mx-auto">
                                    {profileUser.status === 'seeking' ? 'Seeking Collaboration' : 'Actively Building'}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                         {currentUser?.uid !== profileUser.id && (
                             <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white" onClick={handleSendMessage}>
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
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profileUser.skills && profileUser.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profileUser.skills.map(skill => (
                                    <Badge key={skill.name} variant={skill.isPrimary ? 'default' : 'secondary'}>
                                        {skill.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No skills listed yet.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><School className="h-5 w-5" /> Education</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profileUser.college ? (
                            <p>{profileUser.college}</p>
                        ) : (
                             <p className="text-sm text-muted-foreground">No college information provided.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
