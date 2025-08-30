
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HostProjectDialog } from '@/components/host-project-dialog';
import { ImageSlider } from '@/components/image-slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, MessageSquare, Users } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
       <>
        <Header />
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh_-_65px)]">
            {/* You can add a skeleton loader here if you want */}
         </div>
       </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex flex-col min-h-[calc(100vh_-_65px)]">
        <main className="flex-1">
          {user ? (
            <LoggedInView />
          ) : (
            <LoggedOutView />
          )}
        </main>
      </div>
    </>
  );
}


function LoggedInView() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col justify-center space-y-4 text-center mb-12">
                     <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                        Welcome back!
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                        What would you like to do today?
                    </p>
                </div>
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>Browse Projects</CardTitle>
                            <CardDescription>Find exciting projects to join and collaborate on.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Link href="/projects" passHref>
                                <Button className="w-full">
                                    View Projects <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                     <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>Host a Project</CardTitle>
                            <CardDescription>Have an idea? Host your own project and find collaborators.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <HostProjectDialog />
                        </CardContent>
                    </Card>
                     <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>Join a Chat</CardTitle>
                            <CardDescription>Discuss ideas and progress with your project teams.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/chatroom" passHref>
                                <Button className="w-full" variant="outline">
                                    Go to Chatrooms <MessageSquare className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}


function LoggedOutView() {
  return (
      <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
              <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="space-y-4">
                      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-6xl/none">
                          Welcome to LocalHost
                      </h1>
                      <p className="max-w-[600px] text-muted-foreground md:text-xl">
                          Connect, Collaborate, Innovate. Your next great idea starts here. Find projects, build teams, and create amazing things together.
                      </p>
                       <div className="flex flex-col gap-2 min-[400px]:flex-row">
                          <Link href="/projects" passHref>
                            <Button size="lg">Get Started</Button>
                          </Link>
                      </div>
                  </div>
                  <div className="w-full">
                     <ImageSlider />
                  </div>
              </div>
               <div className="mt-20 lg:mt-28">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Why LocalHost?</h2>
                    <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl/relaxed">A platform built for students, by students, to foster innovation right from the college grounds.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>Collaboration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Easily find team members from various disciplines and colleges to bring your ideas to life.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M15.5 2.894a.5.5 0 0 0 .309.905l.363.12a1 1 0 0 1 .524 1.342l-.373.647a.5.5 0 0 0 .22.68l.42.242a1 1 0 0 1 .524 1.342l-.373.647a.5.5 0 0 0 .22.68l.42.243a1 1 0 0 1 .524 1.342l-.373.647a.5.5 0 0 0 .22.68l.42.242a1 1 0 0 1 .524 1.342l-1.5 2.6A.5.5 0 0 0 20 18.291V21.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5v-3.209a.5.5 0 0 0-.191-.397l-1.5-2.6a1 1 0 0 1 .524-1.342l.42-.242a.5.5 0 0 0 .22-.68l-.373-.647a1 1 0 0 1 .524-1.342l.42-.243a.5.5 0 0 0 .22-.68l-.373-.647a1 1 0 0 1 .524-1.342l.363-.12a.5.5 0 0 0 .309-.905L6.5 2.5l4 4L12.5 5l4-4Z"/></svg>
                            </div>
                            <CardTitle>Innovation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Showcase your projects, participate in events, and get recognized for your innovative solutions.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                           <div className="bg-primary/10 p-3 rounded-full">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>Community</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">Engage in discussions, share knowledge, and grow with a community of like-minded peers.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </div>
      </section>
  );
}
