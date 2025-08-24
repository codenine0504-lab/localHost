
'use client';

import { Button } from '@/components/ui/button';
import { ImageSlider } from '@/components/image-slider';
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
      <section className="w-full py-20 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
                Welcome to <span className="text-shine">LocalHost</span>
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
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Featured Projects
              </h2>
            </div>
          </div>
          <div className="mx-auto max-w-5xl pt-12">
            <ImageSlider />
          </div>
        </div>
      </section>
    </>
  );
}
