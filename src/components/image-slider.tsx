
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

interface Project {
    id: string;
    title: string;
    imageUrl?: string;
}

export function ImageSlider() {
  const [api, setApi] = useState<CarouselApi>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projs: Project[] = [];
      querySnapshot.forEach((doc) => {
        projs.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api]);
  
  if (loading) {
      return (
          <div className="relative w-full max-w-4xl mx-auto">
              <Skeleton className="aspect-video w-full rounded-xl shadow-lg" />
          </div>
      )
  }
  
  if (projects.length === 0 && !loading) {
      return (
           <div className="relative w-full max-w-4xl mx-auto">
                <Card className="overflow-hidden shadow-lg rounded-xl">
                  <CardContent className="flex aspect-video items-center justify-center p-0 bg-muted">
                    <p className="text-muted-foreground">No projects yet. Host one to feature it here!</p>
                  </CardContent>
                </Card>
            </div>
      )
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {projects.map((project) => (
            <CarouselItem key={project.id}>
              <div className="p-1">
                <Card className="overflow-hidden shadow-lg rounded-xl">
                  <CardContent className="flex aspect-video items-center justify-center p-0">
                    <Image
                      src={project.imageUrl || 'https://placehold.co/1200x600.png'}
                      alt={project.title}
                      width={1200}
                      height={600}
                      className="object-cover w-full h-full"
                      data-ai-hint="project image"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
      </Carousel>
    </div>
  );
}
