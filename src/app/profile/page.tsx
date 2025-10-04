
'use client';

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedHeader } from "@/components/animated-header";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const collegesByCity: Record<string, string[]> = {
  raipur: ["NIT Raipur", "Government Engineering College, Raipur", "Shankarcharya Group of Institutions", "Amity University, Raipur", "RITEE - Raipur Institute of Technology"],
  bilaspur: ["Guru Ghasidas Vishwavidyalaya", "Government Engineering College, Bilaspur"],
  bhilai: ["IIT Bhilai", "Bhilai Institute of Technology, Durg"],
};

const interests = [
    { id: 'software', label: 'Software' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'design', label: 'Design' },
    { id: 'event', label: 'Event' },
];

function ProfileSkeleton() {
    return (
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 p-6">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </CardHeader>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>Update your personal and university information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="space-y-2 pt-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-5 w-40" />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Interests</Label>
                             <div className="grid grid-cols-2 gap-4 pt-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        </div>
                         <Separator />
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="college">University/College</Label>
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [status, setStatus] = useState<'seeking' | 'active' | 'none'>('none');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { toast } = useToast();

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || '');
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.city) {
            setSelectedCity(userData.city);
            setColleges(collegesByCity[userData.city] || []);
          }
          if (userData.college) {
            setSelectedCollege(userData.college);
          }
          if (userData.status) {
            setStatus(userData.status);
          }
          if (userData.interests) {
            setSelectedInterests(userData.interests);
          }
        } else {
             await setDoc(userDocRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                status: 'none',
                interests: [],
            }, { merge: true });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setColleges(collegesByCity[city] || []);
    setSelectedCollege(''); // Reset college selection
  };

  const handleInterestChange = (interestId: string) => {
    setSelectedInterests(prev => 
        prev.includes(interestId) 
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  }

  const handleUpdate = async () => {
    if (!user) {
        toast({ title: "Not Logged In", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }

    try {
        if(displayName !== user.displayName) {
            await updateProfile(user, { displayName });
        }
        
        await setDoc(doc(db, "users", user.uid), {
            displayName: displayName,
            city: selectedCity,
            college: selectedCollege,
            status: status,
            interests: selectedInterests
        }, { merge: true });

        toast({
        title: "Success!",
        description: "Your details have been updated.",
        });
    } catch (error) {
        console.error("Error updating document: ", error);
        toast({
        title: "Error",
        description: "Could not update your details. Please try again.",
        variant: "destructive",
        });
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <>
        
        <div className="container mx-auto py-12 px-4 md:px-6">
        <AnimatedHeader 
            title="Your Profile"
            description="View and update your personal details."
        />
        {loading ? (
             <ProfileSkeleton />
        ) : !user ? (
            <div className="text-center">Please log in to view your profile.</div>
        ) : (
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                <Card className="overflow-hidden relative">
                     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-accent/20" />
                    <CardHeader className="flex flex-row items-center gap-4 p-6 bg-transparent relative z-10">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                            <AvatarImage src={user.photoURL || undefined} alt="User avatar" data-ai-hint="user avatar" />
                            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <CardTitle className="text-xl break-all">{displayName}</CardTitle>
                            <CardDescription className="text-xs break-all">{user.email}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                </div>
                <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>Update your personal and university information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>

                    <div className="space-y-3">
                        <Label>Status</Label>
                        <RadioGroup defaultValue={status} onValueChange={(value) => setStatus(value as 'seeking' | 'active' | 'none')} className="flex flex-col space-y-2 pt-1">
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="seeking" id="seeking" />
                                <Label htmlFor="seeking" className="font-normal">Seeking Collaboration</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="active" id="active" />
                                <Label htmlFor="active" className="font-normal">Actively Building</Label>
                            </div>
                             <div className="flex items-center space-x-3">
                                <RadioGroupItem value="none" id="none" />
                                <Label htmlFor="none" className="font-normal">Not Specified</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label>Interests / Skills</Label>
                        <p className="text-sm text-muted-foreground">Select themes that match your interests.</p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {interests.map((interest) => (
                                <div key={interest.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={interest.id}
                                        checked={selectedInterests.includes(interest.id)}
                                        onCheckedChange={() => handleInterestChange(interest.id)}
                                    />
                                    <label
                                        htmlFor={interest.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {interest.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Select onValueChange={handleCityChange} value={selectedCity}>
                        <SelectTrigger id="city">
                            <SelectValue placeholder="Select a city" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="raipur">Raipur</SelectItem>
                            <SelectItem value="bilaspur">Bilaspur</SelectItem>
                            <SelectItem value="bhilai">Bhilai</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="college">University/College</Label>
                        <Select disabled={!selectedCity} onValueChange={setSelectedCollege} value={selectedCollege}>
                        <SelectTrigger id="college">
                            <SelectValue placeholder="Select your university/college" />
                        </SelectTrigger>
                        <SelectContent>
                            {colleges.map((college) => (
                            <SelectItem key={college} value={college}>
                                {college}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleUpdate}>Update Profile</Button>
                    </CardContent>
                </Card>
                </div>
            </div>
        )}
        </div>
    </>
  );
}
