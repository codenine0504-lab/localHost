
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface AppUser {
  id: string;
  displayName: string | null;
  photoURL: string | null;
  college?: string;
  email?: string;
}

function PeopleSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-col items-center text-center">
                        <Skeleton className="h-24 w-24 rounded-full mb-4" />
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

export default function PeoplePage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userList: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(userList);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="space-y-4 mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Discover People</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Connect with students and creators from various colleges. Find your next collaborator.</p>
        </div>

        {loading ? (
            <PeopleSkeleton />
        ) : users.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {users.map((user) => (
                    <Card key={user.id} className="text-center hover:shadow-lg transition-shadow">
                        <Link href={`/profile/${user.id}`}>
                            <CardHeader className="flex flex-col items-center">
                                 <Avatar className="h-24 w-24 mb-4 border-2 border-primary/50">
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'}/>
                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <CardTitle>{user.displayName || 'Anonymous User'}</CardTitle>
                                {user.college && <CardDescription>{user.college}</CardDescription>}
                            </CardHeader>
                        </Link>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center text-muted-foreground py-10 col-span-full border rounded-lg">
                <p>No users found.</p>
            </div>
        )}
    </div>
  );
}

    