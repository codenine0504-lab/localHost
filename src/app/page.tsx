
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HostProjectDialog } from '@/components/host-project-dialog';
import { useEffect, useState } from 'react';
import { WelcomeScreen } from '@/components/welcome-screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Users, Code, Brush, Milestone, Cpu, Eye, Compass } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';


interface Project {
  id: string;
  title: string;
  description: string;
  theme: 'software' | 'hardware' | 'event' | 'design';
  college: string;
  imageUrl?: string;
  views?: number;
}

interface AppUser {
    id: string;
    displayName: string | null;
    photoURL: string | null;
}

const themes = [
    { name: 'Software', icon: Code, color: 'bg-blue-500' },
    { name: 'Hardware', icon: Cpu, color: 'bg-green-500' },
    { name: 'Event', icon: Milestone, color: 'bg-pink-500' },
    { name: 'Design', icon: Brush, color: 'bg-purple-500' },
];

function AppSkeleton() {
  return (
    <div className="flex flex-col min-h-screen container mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
       <Skeleton className="h-10 w-40 mb-4" />
       <div className="flex space-x-4 mb-8">
         {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-40" />)}
      </div>
       <Skeleton className="h-10 w-40 mb-4" />
       <div className="flex space-x-4 mb-8">
         {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-16 rounded-full" />)}
      </div>
      <Skeleton className="h-10 w-56 mb-4" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Skeleton className="h-64 w-full" />
         <Skeleton className="h-64 w-full" />
         <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<AppUser[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // This check now runs on the client-side
    const hasVisited = localStorage.getItem('hasVisited');
    if (hasVisited) {
      setShowWelcome(false);
    } else {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeFinish = () => {
    setShowWelcome(false);
    localStorage.setItem('hasVisited', 'true');
    // We manually dispatch a storage event to make sure the AppLayout updates immediately
    window.dispatchEvent(new Event('storage'));
  }

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch featured projects
            const projectsQuery = query(collection(db, 'projects'), orderBy('views', 'desc'), limit(6));
            const projectsSnapshot = await getDocs(projectsQuery);
            const projs = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setFeaturedProjects(projs);

            // Fetch people
            const usersQuery = query(collection(db, 'users'), limit(10));
            const usersSnapshot = await getDocs(usersQuery);
            const userList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
            setPeople(userList);

        } catch (error) {
            console.error("Error fetching homepage data:", error);
        } finally {
            setLoading(false);
        }
    };
    if (!authLoading && !showWelcome) {
        fetchData();
    }
  }, [authLoading, showWelcome]);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (showWelcome) {
    return (
      <WelcomeScreen onFinish={handleWelcomeFinish} />
    );
  }

  if (authLoading || loading) {
    return <AppSkeleton />;
  }


  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-16">
        {/* User Greeting */}
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'}/>
                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Hi, {user?.displayName || 'Guest'}!</h1>
                <p className="text-muted-foreground">Let's create something amazing today.</p>
            </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4">
            <HostProjectDialog>
                 <Card className="group cursor-pointer bg-blue-500 text-white hover:bg-blue-600 transition-all h-full flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                            <Users className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                            Host a Project
                        </CardTitle>
                        <CardDescription className="text-blue-100 text-xs md:text-sm">Start your own project and invite collaborators.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-white group-hover:translate-x-1 transition-transform flex items-center text-sm font-semibold">
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </HostProjectDialog>
            <Link href="/projects" className="block">
                <Card className="group cursor-pointer hover:border-primary transition-all h-full flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                             <Compass className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                            Join a Project
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm">Explore existing projects and collaborate.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="text-primary group-hover:translate-x-1 transition-transform flex items-center text-sm">
                            Explore Projects <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>

        {/* Themes Section */}
        <div>
            <h2 className="text-2xl font-bold mb-4">Explore by Theme</h2>
            <div className="relative overflow-hidden group w-full">
                <div className="flex gap-4 scroller group-hover:[animation-play-state:paused]">
                    {[...themes, ...themes].map((theme, index) => (
                    <Card key={`${theme.name}-${index}`} className="w-40 flex-shrink-0 hover:shadow-lg transition-shadow">
                            <Link href={`/projects?theme=${theme.name.toLowerCase()}`} className="block">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <div className={`p-3 rounded-full ${theme.color}`}>
                                    <theme.icon className="h-6 w-6 text-white" />
                                </div>
                                <p className="font-semibold">{theme.name}</p>
                            </CardContent>
                        </Link>
                    </Card>
                    ))}
                </div>
            </div>
        </div>
        
         {/* People Section */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Connect with People</h2>
                 <Button asChild variant="ghost" className="text-primary">
                    <Link href="/people">
                        View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
             <div className="relative overflow-hidden group w-full">
                 <div className="flex gap-6 scroller group-hover:[animation-play-state:paused]">
                    {[...people, ...people].map((person, index) => (
                    <Link href={`/profile/${person.id}`} key={`${person.id}-${index}`}>
                        <div className="flex flex-col items-center gap-2 text-center w-20 flex-shrink-0">
                            <Avatar className="h-16 w-16 border-2 border-muted hover:border-primary transition-all">
                                <AvatarImage src={person.photoURL || undefined} alt={person.displayName || 'User'}/>
                                <AvatarFallback>{getInitials(person.displayName)}</AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium truncate w-full">{person.displayName || 'User'}</p>
                        </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>


        {/* Featured Projects Section */}
        <div>
            <h2 className="text-2xl font-bold mb-4">Featured Projects</h2>
            {featuredProjects.length > 0 ? (
                 <div className="grid gap-6 md:grid-cols-2">
                    {featuredProjects.map((project) => (
                        <Card key={project.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                           <Link href={`/projects/${project.id}`} className="block cursor-pointer h-full">
                                <div className="flex h-full">
                                    <div className="relative w-1/3">
                                        <Image
                                            src={project.imageUrl || 'https://placehold.co/400x400.png'}
                                            alt={`Image for ${project.title}`}
                                            layout="fill"
                                            objectFit="cover"
                                            data-ai-hint="project image"
                                        />
                                    </div>
                                    <div className="w-2/3 flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="truncate text-lg">{project.title}</CardTitle>
                                            <CardDescription>{project.college}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow flex flex-col justify-end">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{project.theme}</Badge>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                                                    <Eye className="h-4 w-4" />
                                                    <span>{project.views || 0}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </div>
                           </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 col-span-full border rounded-lg">
                    <p>No featured projects available yet. Be the first to host one!</p>
                </div>
            )}
        </div>
    </div>
  );
}
