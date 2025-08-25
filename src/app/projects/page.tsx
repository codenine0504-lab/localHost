
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectDetailsDialog } from '@/components/project-details-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from 'lucide-react';


interface Project {
  id: string;
  title: string;
  description: string;
  theme: 'software' | 'hardware' | 'event' | 'design';
  college: string;
  imageUrl?: string;
  isPrivate?: boolean;
}

function ProjectCardSkeleton() {
    return (
        <Card className="flex flex-col overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-6 w-20" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeFilter, setThemeFilter] = useState<Project['theme'] | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribeProjects = onSnapshot(q, (querySnapshot) => {
      const projs: Project[] = [];
      querySnapshot.forEach((doc) => {
        projs.push({ id: doc.id, ...doc.data(), isPrivate: false } as Project);
      });
      setProjects(projs);
      setLoading(false);
    });

    return () => {
        unsubscribeProjects();
    };
  }, []);

  const filteredProjects = useMemo(() => {
    if (!themeFilter) {
      return projects;
    }
    return projects.filter(project => project.theme === themeFilter);
  }, [projects, themeFilter]);

  const getThemeBadgeVariant = (theme: Project['theme']): 'software' | 'hardware' | 'event' | 'design' | 'secondary' => {
    const themeMap = {
        software: 'software',
        hardware: 'hardware',
        event: 'event',
        design: 'design',
    };
    return themeMap[theme] || 'secondary';
  }


  return (
    <>
        <Header />
        <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="space-y-4 mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-normal">Join Project and Events across different colleges/universities</h1>
        </div>
        <div className="flex justify-end mb-6">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter by theme
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setThemeFilter(null)}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setThemeFilter('software')}>Software</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setThemeFilter('hardware')}>Hardware</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setThemeFilter('event')}>Event</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setThemeFilter('design')}>Design</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {loading ? (
                <>
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                </>
             ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                    <ProjectDetailsDialog project={project} key={project.id}>
                        <Card className="flex flex-col overflow-hidden h-full cursor-pointer hover:border-primary transition-colors duration-300">
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
                                <Badge variant={getThemeBadgeVariant(project.theme)}>{project.theme}</Badge>
                            </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline">
                                    View Details
                                </Button>
                            </CardFooter>
                        </Card>
                    </ProjectDetailsDialog>
                ))
            ) : (
                 <div className="text-center text-muted-foreground py-10 col-span-full">
                    <p>No projects found for the selected theme.</p>
                </div>
            )}
        </div>
        </div>
    </>
  );
}
