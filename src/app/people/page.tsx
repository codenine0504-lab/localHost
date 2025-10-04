
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedHeader } from '@/components/animated-header';
import { Input } from '@/components/ui/input';
import { Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { UserProfileCard } from '@/components/user-profile-card';
import type { AppUser, Skill } from '@/types';

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'seeking', label: 'Seeking' },
    { id: 'active', label: 'Active' },
    { id: 'software', label: 'Software' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'design', label: 'Design' },
    { id: 'event', label: 'Event' },
];

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
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  useEffect(() => {
    let q;
    const isStatusFilter = ['seeking', 'active'].includes(activeTab);
    
    const skillThemes = ['software', 'hardware', 'design', 'event'];
    const isThemeFilter = skillThemes.includes(activeTab);

    if (activeTab === 'all') {
        q = query(collection(db, 'users'), orderBy('displayName'));
    } else if (isStatusFilter) {
        q = query(collection(db, 'users'), where('status', '==', activeTab), orderBy('displayName'));
    } else if (isThemeFilter) {
        q = query(collection(db, 'users'), where('interests', 'array-contains', activeTab), orderBy('displayName'));
    } else {
        q = query(collection(db, 'users'), orderBy('displayName'));
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

  const getPrimarySkill = (skills: Skill[] | undefined) => {
      if (!skills) return null;
      return skills.find(skill => skill.isPrimary);
  }

  return (
    <>
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
        
        <div className="mb-8">
             <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
                <CarouselContent className="-ml-2">
                    {tabs.map((tab, index) => (
                        <CarouselItem key={tab.id} className="pl-2 basis-auto">
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id ? 'text-white' : 'hover:text-foreground/60'
                                } relative rounded-full px-4 py-2 text-sm font-medium text-foreground transition focus-visible:outline-2`}
                                style={{
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                {activeTab === tab.id && (
                                    <motion.span
                                        layoutId="bubble"
                                        className="absolute inset-0 z-10 bg-primary shadow-sm"
                                        style={{ borderRadius: 9999 }}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-20 whitespace-nowrap">{tab.label}</span>
                            </button>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>


        <div className="max-w-4xl mx-auto">
            {loading ? (
                <PeopleSkeleton />
            ) : filteredUsers.length > 0 ? (
                <div className="space-y-4">
                    {filteredUsers.map((user) => {
                        const primarySkill = getPrimarySkill(user.skills);
                        const hasSkills = user.skills && user.skills.length > 0;
                        return (
                        <div key={user.id} onClick={() => setSelectedUser(user)} className="cursor-pointer">
                            <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'}/>
                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{user.displayName || 'Anonymous User'}</h3>
                                    {hasSkills ? (
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            {primarySkill && (
                                                <Badge variant="default" className="flex items-center gap-1.5">
                                                    <Star className="h-3 w-3" />
                                                    {primarySkill.name}
                                                </Badge>
                                            )}
                                            {user.skills?.filter(s => !s.isPrimary).slice(0, 3).map(skill => (
                                                <Badge key={skill.name} variant="secondary">{skill.name}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        user.college && <p className="text-sm text-muted-foreground mt-1">{user.college}</p>
                                    )}
                                </div>
                                <div className='flex flex-col items-end gap-2'>
                                  {getStatusBadge(user.status)}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 col-span-full border rounded-lg">
                    <p>No users found for the selected filter.</p>
                </div>
            )}
        </div>
    </div>
    {selectedUser && (
        <UserProfileCard
            user={selectedUser}
            isOpen={!!selectedUser}
            onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}
        />
    )}
    </>
  );
}
