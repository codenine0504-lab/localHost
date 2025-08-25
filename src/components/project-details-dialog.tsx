'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, query, where, getDocs, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { Share2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface Project {
  id: string;
  title: string;
  description: string;
  theme: string;
  college: string;
  imageUrl?: string;
  isPrivate?: boolean;
}

interface ProjectDetailsDialogProps {
  project: Project;
  children: React.ReactNode;
}

export function ProjectDetailsDialog({ project, children }: ProjectDetailsDialogProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'sent'>('idle');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
      const checkExistingRequest = async () => {
          if (!user || !project.isPrivate) return;

          const q = query(
              collection(db, 'joinRequests'),
              where('projectId', '==', project.id),
              where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
              setRequestStatus('sent');
          }
      };

      if (user && project.isPrivate) {
        checkExistingRequest();
      }
  }, [user, project.id, project.isPrivate]);


  const handleJoinOrRequest = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to join the project.',
        variant: 'destructive',
      });
      return;
    }

    if (project.isPrivate) {
      handleRequestToJoin();
    } else {
      handleJoinPublicProject();
    }
  };

  const handleJoinPublicProject = async () => {
    if (!user) return;
    try {
        const projectRef = doc(db, 'projects', project.id);
         await updateDoc(projectRef, {
            members: arrayUnion(user.uid)
        });

        const audio = new Audio('/join.mp3');
        audio.play();
        router.push(`/chatroom/${project.id}`);
    } catch (error) {
        console.error("Error joining public project:", error);
        toast({
            title: 'Error',
            description: 'Could not join the project. Please try again.',
            variant: 'destructive'
        });
    }
  }

  const handleRequestToJoin = async () => {
    if (!user) return;
    setRequestStatus('pending');
    try {
        await addDoc(collection(db, 'joinRequests'), {
            projectId: project.id,
            projectTitle: project.title,
            userId: user.uid,
            userDisplayName: user.displayName,
            userPhotoURL: user.photoURL,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        setRequestStatus('sent');
        toast({
            title: 'Request Sent',
            description: 'Your request to join has been sent to the project admin.',
        });
    } catch (error) {
        console.error("Error sending join request:", error);
        setRequestStatus('idle');
        toast({
            title: 'Error',
            description: 'Could not send your join request. Please try again.',
            variant: 'destructive'
        });
    }
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/chatroom/${project.id}`;
    const shareData = {
        title: `Join my project: ${project.title}`,
        text: `Join "${project.title}" on LocalHost!`,
        url: shareUrl,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast({
                title: 'Link Copied',
                description: 'Project invitation link copied to clipboard.',
            });
        }
    } catch (error) {
        console.error('Error sharing:', error);
        toast({
            title: 'Error',
            description: 'Could not share the project link.',
            variant: 'destructive',
        });
    }
  };

  const getButtonText = () => {
    if (project.isPrivate) {
        switch (requestStatus) {
            case 'pending': return 'Sending...';
            case 'sent': return 'Request Sent';
            default: return 'Request to Join';
        }
    }
    return 'Join Project';
  }


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 max-h-[90vh] md:max-h-[70vh] flex flex-col">
        <ScrollArea className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column (Image and Title) */}
              <div className="flex flex-col relative order-first">
                <div className="relative h-60 w-full md:h-full">
                  <Image
                    src={project.imageUrl || 'https://placehold.co/600x400.png'}
                    alt={`Image for ${project.title}`}
                    layout="fill"
                    objectFit="cover"
                    className="md:rounded-l-lg"
                    data-ai-hint="project image"
                  />
                  <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/70 hover:bg-background/90"
                      onClick={handleShare}
                      aria-label="Share project"
                  >
                      <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-6 bg-background rounded-b-lg md:hidden">
                    <DialogTitle className="text-2xl">{project.title}</DialogTitle>
                    <DialogDescription>{project.college}</DialogDescription>
                     <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary">{project.theme}</Badge>
                        {project.isPrivate && <Badge variant="outline">Private</Badge>}
                    </div>
                </div>
              </div>
              
              {/* Right Column (Description and Join button) */}
              <div className="p-6 flex flex-col">
                 <div className="hidden md:block mb-6">
                    <DialogTitle className="text-2xl">{project.title}</DialogTitle>
                    <DialogDescription>{project.college}</DialogDescription>
                     <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary">{project.theme}</Badge>
                        {project.isPrivate && <Badge variant="outline">Private</Badge>}
                    </div>
                </div>
                 <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-0 border-t">
          <Button
            className="w-full"
            onClick={handleJoinOrRequest}
            disabled={requestStatus === 'pending' || requestStatus === 'sent'}
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
