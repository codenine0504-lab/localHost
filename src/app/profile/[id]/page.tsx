
'use client';

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { doc, getDoc, collection, query, where, getDocs, serverTimestamp, writeBatch, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedHeader } from "@/components/animated-header";
import { Instagram, Github, Linkedin, Link as LinkIcon, Briefcase, School, MessageSquare, LogIn, CheckCircle2, LogOut, Settings, MapPin } from "lucide-react";
import { useRouter, useParams } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import type { AppUser } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { EditableProfile } from "@/components/editable-profile";
import { SuggestionDialog } from "@/components/suggestion-dialog";


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
  const { user, loading: authLoading } = useAuth();
  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.id as string;
  const isOwnProfile = user?.id === userId;

  const fetchUser = async () => {
    if (!userId) {
        setLoading(false);
        return;
    };
    if (!user && !authLoading) {
        setLoading(false);
        return;
    }

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

  useEffect(() => {
    fetchUser();
  }, [userId, user, authLoading]);
  
  const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            toast({
                title: "Signed In",
                description: "You have successfully signed in.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Sign in failed",
                description: "Could not sign in with Google. Please try again.",
                variant: "destructive"
            });
        }
    };
    
  const handleSignOut = async () => {
    try {
        await signOut();
        toast({
            title: "Signed Out",
            description: "You have been successfully signed out.",
        });
        router.push('/');
    } catch (error) {
        console.error(error);
        toast({
            title: "Sign out failed",
            description: "Could not sign out. Please try again.",
            variant: "destructive"
        });
    }
  };

  const handleSendMessage = async () => {
    if (!profileUser || !user) {
        toast({
            title: "Please log in",
            description: "You need to be logged in to send a message.",
            variant: "destructive",
        })
        return;
    };
    
    if (user.id === profileUser.id) {
        toast({
            title: "Cannot message yourself",
            description: "You cannot start a conversation with yourself.",
        });
        return;
    }
    
    const chatRoomId = [user.id, profileUser.id].sort().join('_');
    const chatRoomRef = doc(db, 'General', chatRoomId);
    
    try {
        const chatRoomDoc = await getDoc(chatRoomRef);

        if (!chatRoomDoc.exists()) {
             const batch = writeBatch(db);
             
             const currentUserDoc = await getDoc(doc(db, 'users', user.id));
             const otherUserDoc = await getDoc(doc(db, 'users', profileUser.id));

             const currentUserData = currentUserDoc.data();
             const otherUserData = otherUserDoc.data();
             
             batch.set(chatRoomRef, {
                members: [user.id, profileUser.id],
                createdAt: serverTimestamp(),
                memberDetails: {
                    [user.id]: {
                        displayName: currentUserData?.displayName || 'User',
                        photoURL: currentUserData?.photoURL || '',
                    },
                    [profileUser.id]: {
                        displayName: otherUserData?.displayName || 'User',
                        photoURL: otherUserData?.photoURL || '',
                    }
                }
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

  if (loading || authLoading) {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <AnimatedHeader title="Loading Profile" description="Please wait..." />
            <ProfileSkeleton />
        </div>
    );
  }

  if (!user) {
     return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <AnimatedHeader title="View Profile" description="Sign in to view user profiles and connect with others." />
             <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Get full access</CardTitle>
                    <CardDescription>Sign in to message users and join projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleSignIn} className="w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <AnimatedHeader title="User Not Found" description="This profile does not exist or could not be loaded." />
        <Button onClick={() => router.push('/people')}>Back to People</Button>
      </div>
    );
  }
  
  if (isOwnProfile && isEditing) {
      return (
          <EditableProfile 
            user={profileUser}
            onClose={() => setIsEditing(false)}
            onProfileUpdate={() => {
                fetchUser();
                setIsEditing(false);
            }}
          />
      )
  }

  const socialLinks = [
    { platform: 'github', value: profileUser.github, icon: Github, urlPrefix: 'https://github.com/' },
    { platform: 'linkedin', value: profileUser.linkedin, icon: Linkedin, urlPrefix: '' },
    { platform: 'instagram', value: profileUser.instagram, icon: Instagram, urlPrefix: 'https://instagram.com/' },
    { platform: 'otherLink', value: profileUser.otherLink, icon: LinkIcon, urlPrefix: '' },
  ].filter(link => link.value);

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
        <AnimatedHeader title={profileUser.displayName || 'User Profile'} description={profileUser.college ? `${profileUser.college}${profileUser.city ? `, ${profileUser.city}` : ''}` : 'Discover this user\'s profile'} />
        
        <div className="md:pt-0">
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
                                <div className="flex items-center gap-1.5 justify-center">
                                    <CardTitle className="text-xl break-all">{profileUser.displayName}</CardTitle>
                                    {profileUser.role === 'organization' && (
                                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                    )}
                                </div>
                                {profileUser.status && profileUser.status !== 'none' && (
                                    <Badge variant={profileUser.status === 'seeking' ? 'default' : 'secondary'} className="mx-auto">
                                        {profileUser.status === 'seeking' ? 'Seeking Collaboration' : 'Actively Building'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                             {!isOwnProfile && user && (
                                 <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white" onClick={handleSendMessage}>
                                     <MessageSquare className="mr-2 h-4 w-4" /> Message
                                 </Button>
                             )}
                             {isOwnProfile && (
                                <div className="flex flex-col gap-2">
                                    <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                                        <Settings className="mr-2 h-4 w-4" /> Edit Profile
                                    </Button>
                                    <SuggestionDialog />
                                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                    </Button>
                                </div>
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
                            {profileUser.college || profileUser.city ? (
                                <div className="space-y-1">
                                    {profileUser.college && <p>{profileUser.college}</p>}
                                    {profileUser.city && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profileUser.city}</p>}
                                </div>
                            ) : (
                                 <p className="text-sm text-muted-foreground">No college information provided.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><School className="h-5 w-5" /> Interests</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {profileUser.interests && profileUser.interests.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {profileUser.interests.map(interest => (
                                        <Badge key={interest} variant="outline">
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                 <p className="text-sm text-muted-foreground">No interests listed yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}
