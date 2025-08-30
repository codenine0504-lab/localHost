
'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { HostProjectDialog } from '@/components/host-project-dialog';
import { ImageSlider } from '@/components/image-slider';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Header />
      <div className="flex flex-col min-h-[calc(100vh_-_65px)]">
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="grid gap-6 lg:grid-cols-1 items-center">
                <div className="flex flex-col justify-center space-y-4 text-center">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Connect, Collaborate, Innovate
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                    Your next great idea starts here. Join a vibrant community of creators and builders.
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                    <HostProjectDialog />
                    <Link
                      href="/projects"
                      className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                      Explore Projects
                    </Link>
                  </div>
                </div>
              </div>
               <ImageSlider />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
