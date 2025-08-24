
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  description: string;
  theme: string;
  college: string;
  imageUrl?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });

    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribeProjects = onSnapshot(q, (querySnapshot) => {
      const projs: Project[] = [];
      querySnapshot.forEach((doc) => {
        projs.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projs);
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeProjects();
    };
  }, []);

  const handleJoinChat = (projectId: string) => {
      if (!user) {
          toast({
              title: "Authentication Required",
              description: "Please log in to join the chat.",
              variant: "destructive"
          });
          return;
      }
      router.push(`/chatroom/${projectId}`);
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">Explore Projects</h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl/relaxed">
          Find interesting projects to join and collaborate with talented individuals.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col overflow-hidden">
            <div className="relative h-48 w-full">
                <Image
                    src={project.imageUrl || 'https://placehold.co/600x400.png'}
                    alt={`Image for ${project.title}`}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="project image"
                />
            </div>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.college}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex flex-wrap gap-2">
                 <Badge variant="secondary">{project.theme}</Badge>
              </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={() => handleJoinChat(project.id)}>
                    Join Chat
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
