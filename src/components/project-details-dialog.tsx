
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="relative h-60 w-full mb-4 rounded-lg overflow-hidden">
             <Image
                src={project.imageUrl || 'https://placehold.co/600x400.png'}
                alt={`Image for ${project.title}`}
                layout="fill"
                objectFit="cover"
                data-ai-hint="project image"
            />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">{project.title}</DialogTitle>
              <DialogDescription>{project.college}</DialogDescription>
            </div>
            {project.isPrivate && <Badge variant="secondary">Private</Badge>}
          </div>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
             <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{project.theme}</Badge>
            </div>
        </div>
        <DialogFooter>
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

    