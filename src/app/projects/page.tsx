
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectDetailsDialog } from '@/components/project-details-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';


interface Project {
  id: string;
  title: string;
  description: string;
  theme: 'software' | 'hardware' | 'event' | 'design';
  college: string;
  imageUrl?: string;
  isPrivate?: boolean;
  budget?: number | null;
  requiresRequestToJoin?: boolean;
  views?: number;
  applicantCount?: number;
}

function ProjectCardSkeleton() {
    return (
        <Card className="flex flex-row overflow-hidden">
            <Skeleton className="h-full w-1/3" />
            <div className="w-2/3 p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-6 w-20 mb-4" />
                <Skeleton className="h-10 w-full" />
            </div>
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
        
        <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="space-y-4 mb-8 text-center">
            <h1 className="text-base text-muted-foreground">Join Project and Events across different colleges/universities</h1>
        </div>
        <div className="flex justify-end mb-6 gap-2">
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
        <div className="grid grid-cols-1 gap-6">
             {loading ? (
                <>
                    {[...Array(4)].map((_, i) => (
                        <ProjectCardSkeleton key={i} />
                    ))}
                </>
             ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                    <Card 
                        key={project.id} 
                        className="overflow-hidden h-full transition-shadow duration-300 hover:shadow-lg flex flex-row"
                    >
                        <Link href={`/projects/${project.id}`} className="block cursor-pointer w-1/3">
                            <div className="relative h-full w-full">
                                <Image
                                    src={project.imageUrl || 'https://placehold.co/400x400.png'}
                                    alt={`Image for ${project.title}`}
                                    layout="fill"
                                    objectFit="cover"
                                    data-ai-hint="project image"
                                />
                            </div>
                        </Link>
                        <div className="flex flex-col w-2/3">
                            <CardHeader>
                                <CardTitle className="text-lg">{project.title}</CardTitle>
                                <CardDescription>{project.college}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={getThemeBadgeVariant(project.theme)}>{project.theme}</Badge>
                                    {project.budget && (
                                        <Badge variant="secondary">
                                            Budget: ₹{project.budget.toLocaleString()}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Eye className="h-4 w-4" />
                                        <span>{project.views || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4" />
                                        <span>{project.applicantCount || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" asChild>
                                    <Link href={`/projects/${project.id}`}>
                                        View Details
                                    </Link>
                                 </Button>
                            </CardFooter>
                        </div>
                    </Card>
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
