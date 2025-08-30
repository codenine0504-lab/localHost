
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HostProjectDialog } from '@/components/host-project-dialog';
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
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Please log in to continue.</p>
            </div>
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
