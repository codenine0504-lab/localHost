'use client';

import { Header } from '@/components/header';
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
                    Welcome to LocalHost
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                    Connect, Collaborate, Innovate
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
