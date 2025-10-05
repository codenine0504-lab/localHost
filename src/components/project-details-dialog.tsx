
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, query, where, getDocs, serverTimestamp, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { Share2, Eye, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from './auth-provider';
import { signInWithGoogle } from '@/lib/auth';

interface Project {
  id: string;
  title: string;
  description: string;
  theme: string;
  college: string;
  imageUrl?: string;
  isPrivate?: boolean;
  requiresRequestToJoin?: boolean;
  budget?: number;
  views?: number;
  applicantCount?: number;
  owner: string;
  members?: string[];
  isAssigned?: boolean;
}

interface ProjectDetailsDialogProps {
  project: Project;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProjectDetailsDialog({ project, children, open, onOpenChange }: ProjectDetailsDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'sent' | 'member'>('idle');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
      if (open) {
        const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
        const projectRef = doc(db, projectCollection, project.id);
        updateDoc(projectRef, { views: increment(1) });
      }
  }, [open, project.id, project.isPrivate]);

  useEffect(() => {
      const checkRequestAndMembership = async () => {
          if (!user || !project.requiresRequestToJoin) {
              setRequestStatus('idle');
              return;
          }

          if (project.members?.includes(user.id)) {
              setRequestStatus('member');
              return;
          }

          const q = query(
              collection(db, 'joinRequests'),
              where('projectId', '==', project.id),
              where('userId', '==', user.id)
          );
          
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              const request = querySnapshot.docs[0].data();
              if (request.status === 'pending') {
                  setRequestStatus('sent');
              }
          } else {
              setRequestStatus('idle');
          }
      };

      if (open && user) {
        checkRequestAndMembership();
      }
  }, [project.id, project.requiresRequestToJoin, open, user, project.members]);


  const handleJoinOrRequest = async () => {
    if (!user) {
        toast({
            title: "Please sign in",
            description: "You need to be logged in to join a project.",
            variant: "destructive"
        });
        await signInWithGoogle();
        return;
    }

    if (project.requiresRequestToJoin) {
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
            members: arrayUnion(user.id)
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
    if (requestStatus !== 'idle' || !user) return;
    setRequestStatus('pending');
    try {
        const collectionName = project.isPrivate ? 'privateProjects' : 'projects';
        await addDoc(collection(db, 'joinRequests'), {
            projectId: project.id,
            projectTitle: project.title,
            projectCollection: collectionName,
            userId: user.id,
            userDisplayName: user.displayName,
            userPhotoURL: user.photoURL,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        
        const projectRef = doc(db, collectionName, project.id);
        await updateDoc(projectRef, { applicantCount: increment(1) });

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
    const shareUrl = `${window.location.origin}/projects`;
    const shareData = {
        title: `Check out projects on LocalHost!`,
        text: `Join and collaborate on projects on LocalHost!`,
        url: shareUrl,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast({
                title: 'Link Copied',
                description: 'Projects page link copied to clipboard.',
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
    if (requestStatus === 'member') return 'Open Chat';
    if (project.requiresRequestToJoin) {
        switch (requestStatus) {
            case 'pending': return 'Sending...';
            case 'sent': return 'Request Sent';
            default: return 'Request to Join';
        }
    }
    return 'Join Project & Chat';
  }
  
   const renderJoinButton = () => {
    const isMember = requestStatus === 'member';

    return (
        <Button
            className="w-full sm:w-auto"
            onClick={isMember ? () => router.push(`/chatroom/${project.id}`) : handleJoinOrRequest}
            disabled={requestStatus === 'pending' || requestStatus === 'sent' || authLoading || project.isAssigned}
        >
            {project.isAssigned ? 'Task Assigned' : getButtonText()}
        </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0 max-h-[90vh] flex flex-col md:flex-row">
        <div className="md:w-1/2 flex flex-col p-6">
            <div className="relative h-48 md:h-64 w-full">
                <Image
                    src={project.imageUrl || 'https://placehold.co/600x400.png'}
                    alt={`Image for ${project.title}`}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="project image landscape"
                />
                 {project.isAssigned && (
                    <Badge className="absolute top-2 right-2" variant="secondary">Task Assigned</Badge>
                )}
            </div>
            <div className="pt-6 flex-1">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-2xl md:text-3xl font-bold">{project.title}</DialogTitle>
                    <p className="text-base text-muted-foreground pt-1">{project.college}</p>
                </DialogHeader>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>{project.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{project.applicantCount || 0} applicants</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="md:w-1/2 flex flex-col p-6">
            <ScrollArea className="flex-1 min-h-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                </p>
            </ScrollArea>
            <DialogFooter className="pt-6 flex-shrink-0 flex-row gap-2 !justify-end">
                {renderJoinButton()}
                <Button size="icon" variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
