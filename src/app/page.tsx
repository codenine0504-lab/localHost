
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HostProjectDialog } from '@/components/host-project-dialog';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);


  return (
    <>
      <Header />
      <section className="relative w-full h-[calc(100vh_-_65px)] flex items-center justify-center overflow-hidden">
         <div className="absolute inset-0 radial-gradient-background"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 pulse-glow"></div>
        <div className="container px-4 md:px-6 z-10">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
                Welcome to <span className="text-primary">LocalHost</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Connect, Collaborate, Innovate. Your next great idea starts
                here!
              </p>
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row">
              <HostProjectDialog />
              <Button size="lg" variant="secondary" asChild>
                <Link href="/projects">
                  Join a project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
