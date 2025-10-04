
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { AnimatedHeader } from '@/components/animated-header';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';

interface AppUser {
  id: string;
  displayName: string | null;
  photoURL: string | null;
  college?: string;
  email?: string;
  status?: 'seeking' | 'active' | 'none';
}

function PeopleSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function PeoplePage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let q;
    if (activeTab === 'all') {
        q = query(collection(db, 'users'), orderBy('displayName'));
    } else {
        q = query(collection(db, 'users'), where('status', '==', activeTab), orderBy('displayName'));
    }
    
    setLoading(true);

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
  }, [activeTab]);

  const filteredUsers = users.filter((user) =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: AppUser['status']) => {
      switch (status) {
          case 'seeking':
              return <Badge variant="software">Seeking Collaboration</Badge>;
          case 'active':
              return <Badge variant="hardware">Actively Building</Badge>;
          default:
              return null;
      }
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
        <AnimatedHeader 
            title="Discover People"
            description="Connect with students and creators from various colleges. Find your next collaborator."
        />

        <div className="flex justify-center my-8">
            <div className="relative w-full max-w-lg">
                <Input
                    type="search"
                    placeholder="Search for people..."
                    className="w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="seeking">Seeking</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
        </Tabs>


        <div className="max-w-4xl mx-auto">
            {loading ? (
                <PeopleSkeleton />
            ) : filteredUsers.length > 0 ? (
                <div className="space-y-4">
                    {filteredUsers.map((user) => (
                        <Link href={`/profile/${user.id}`} key={user.id} className="block">
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'}/>
                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{user.displayName || 'Anonymous User'}</h3>
                                    {user.college && <p className="text-sm text-muted-foreground">{user.college}</p>}
                                </div>
                                {getStatusBadge(user.status)}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 col-span-full border rounded-lg">
                    <p>No users found for this category.</p>
                </div>
            )}
        </div>
    </div>
  );
}
