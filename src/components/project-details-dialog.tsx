
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
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  theme: string;
  college: string;
  imageUrl?: string;
}

interface ProjectDetailsDialogProps {
  project: Project;
  children: React.ReactNode;
}

export function ProjectDetailsDialog({ project, children }: ProjectDetailsDialogProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleJoinProject = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to join the project.',
        variant: 'destructive',
      });
      return;
    }
    const audio = new Audio('/join.mp3');
    audio.play();
    router.push(`/chatroom/${project.id}`);
  };

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
          <DialogTitle className="text-2xl">{project.title}</DialogTitle>
          <DialogDescription>{project.college}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
             <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{project.theme}</Badge>
            </div>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleJoinProject}>
            Join Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
