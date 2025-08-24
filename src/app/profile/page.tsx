'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


const collegesByCity: Record<string, string[]> = {
  raipur: ["NIT Raipur", "Government Engineering College, Raipur", "Shankarcharya Group of Institutions", "Amity University, Raipur", "RITEE - Raipur Institute of Technology"],
  bilaspur: ["Guru Ghasidas Vishwavidyalaya", "Government Engineering College, Bilaspur"],
  bhilai: ["IIT Bhilai", "Bhilai Institute of Technology, Durg"],
};

export default function ProfilePage() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const { toast } = useToast();

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setColleges(collegesByCity[city] || []);
    setSelectedCollege(''); // Reset college selection
  };

  const handleUpdate = async () => {
    if (selectedCity && selectedCollege) {
      try {
        // Assuming a user with ID "user1" for now. You'll replace this with dynamic user auth later.
        await setDoc(doc(db, "users", "user1"), {
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

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center text-center p-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="user avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">John Doe</CardTitle>
              <CardDescription>john.doe@example.com</CardDescription>
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
              <Button className="w-full" onClick={handleUpdate}>Update</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
