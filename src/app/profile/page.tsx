
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
import { onAuthStateChanged, User } from 'firebase/auth';


const collegesByCity: Record<string, string[]> = {
  raipur: ["NIT Raipur", "Government Engineering College, Raipur", "Shankarcharya Group of Institutions", "Amity University, Raipur", "RITEE - Raipur Institute of Technology"],
  bilaspur: ["Guru Ghasidas Vishwavidyalaya", "Government Engineering College, Bilaspur"],
  bhilai: ["IIT Bhilai", "Bhilai Institute of Technology, Durg"],
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const { toast } = useToast();

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user's saved data from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.city) {
            setSelectedCity(userData.city);
            setColleges(collegesByCity[userData.city] || []);
          }
          if (userData.college) {
            setSelectedCollege(userData.college);
          }
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

  const handleUpdate = async () => {
    if (!user) {
        toast({ title: "Not Logged In", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    if (selectedCity && selectedCollege) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          city: selectedCity,
          college: selectedCollege
        }, { merge: true });

        toast({
          title: "Success!",
          description: "Your university details have been updated.",
        });
      } catch (error) {
        console.error("Error updating document: ", error);
        toast({
          title: "Error",
          description: "Could not update your details. Please try again.",
          variant: "destructive",
        });
      }
    } else {
        toast({
          title: "Incomplete Information",
          description: "Please select both a city and a college.",
          variant: "destructive",
        });
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <div className="container mx-auto py-12 px-4 md:px-6 text-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="container mx-auto py-12 px-4 md:px-6 text-center">Please log in to view your profile.</div>;
  }


  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center text-center p-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} alt="User avatar" data-ai-hint="user avatar" />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.displayName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>University Details</CardTitle>
              <CardDescription>Select your city and university/college.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select onValuechange={handleCityChange} value={selectedCity}>
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
              <Button className="w-full" onClick={handleUpdate}>Update</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
