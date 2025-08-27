
'use client';

import { Header } from '@/components/header';
import { HostProjectDialog } from '@/components/host-project-dialog';
import { ImageSlider } from '@/components/image-slider';

export default function Home() {
  return (
    <>
      <Header />
       <div className="flex flex-col items-center justify-center text-center py-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Connect, Collaborate, Innovate
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground mb-8">
            Your next great idea starts here! Find projects, join teams, and build the future together.
            </p>
            <HostProjectDialog />
        </div>
        <ImageSlider />
    </>
  );
}
