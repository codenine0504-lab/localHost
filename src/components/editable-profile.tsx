
'use client';

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, Loader2, Star, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { AppUser, Skill } from '@/types';

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required."),
  bio: z.string().max(200, "Bio must be 200 characters or less.").optional(),
  college: z.string().optional(),
  status: z.enum(['none', 'seeking', 'active']),
  skills: z.array(z.object({
    name: z.string().min(1, "Skill name cannot be empty."),
    isPrimary: z.boolean(),
  })).max(10, "You can add up to 10 skills."),
  interests: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  otherLink: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const colleges = ["Goa College of Engineering", "IIT Goa", "NIT Goa", "BITS Pilani Goa"];
const themes = ["software", "hardware", "event", "design"];

interface EditableProfileProps {
  user: AppUser;
  onClose: () => void;
  onProfileUpdate: () => void;
}

export function EditableProfile({ user, onClose, onProfileUpdate }: EditableProfileProps) {
  const { toast } = useToast();
  const [newSkill, setNewSkill] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      bio: user.bio || '',
      college: user.college || '',
      status: user.status || 'none',
      skills: user.skills || [],
      interests: user.interests || [],
      instagram: user.instagram || '',
      github: user.github || '',
      linkedin: user.linkedin || '',
      otherLink: user.otherLink || '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "skills",
  });

  const handleAddSkill = () => {
    if (newSkill.trim() && fields.length < 10) {
      append({ name: newSkill, isPrimary: fields.length === 0 });
      setNewSkill('');
    } else if (fields.length >= 10) {
      toast({
        title: "Skill limit reached",
        description: "You can only add up to 10 skills.",
        variant: "destructive"
      })
    }
  };

  const handleSetPrimary = (index: number) => {
    fields.forEach((_, i) => {
      update(i, { ...fields[i], isPrimary: i === index });
    });
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, data);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      onProfileUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: 'Update Failed',
        description: 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
        
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => <Input id="displayName" {...field} />}
              />
              {errors.displayName && <p className="text-red-500 text-xs">{errors.displayName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Controller
                name="bio"
                control={control}
                render={({ field }) => <Textarea id="bio" placeholder="Tell us about yourself" {...field} />}
              />
              {errors.bio && <p className="text-red-500 text-xs">{errors.bio.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Education & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Education & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Controller
                name="college"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="college">
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="status">Current Status</Label>
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="What are you working on?" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="seeking">Seeking Collaboration</SelectItem>
                                <SelectItem value="active">Actively Building</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Add up to 10 skills. Select one as your primary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. React, Python"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
              />
              <Button type="button" onClick={handleAddSkill} disabled={!newSkill.trim() || fields.length >= 10}>Add</Button>
            </div>
            {errors.skills && <p className="text-red-500 text-xs">{errors.skills.message}</p>}
            <div className="flex flex-wrap gap-2">
              {fields.map((field, index) => (
                <Badge key={field.id} variant={field.isPrimary ? 'default' : 'secondary'} className="flex items-center gap-2">
                  <span>{field.name}</span>
                   <button type="button" onClick={() => handleSetPrimary(index)} className="p-0.5">
                    <Star className={`h-3 w-3 ${field.isPrimary ? 'text-yellow-300 fill-yellow-300' : 'text-gray-400'}`} />
                  </button>
                  <button type="button" onClick={() => remove(index)} className="p-0.5 rounded-full hover:bg-destructive/20">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Interests */}
        <Card>
            <CardHeader>
                <CardTitle>Interests</CardTitle>
                <CardDescription>Select themes that you are interested in.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Controller
                    name="interests"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-2 gap-4">
                            {themes.map((item) => (
                                <div key={item} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={item}
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), item])
                                            : field.onChange(field.value?.filter((value) => value !== item))
                                        }}
                                    />
                                    <label
                                        htmlFor={item}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                    >
                                        {item}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                />
            </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Username</Label>
              <Controller
                name="github"
                control={control}
                render={({ field }) => <Input id="github" placeholder="your-username" {...field} />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
              <Controller
                name="linkedin"
                control={control}
                render={({ field }) => <Input id="linkedin" placeholder="https://linkedin.com/in/..." {...field} />}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Username</Label>
              <Controller
                name="instagram"
                control={control}
                render={({ field }) => <Input id="instagram" placeholder="your-username" {...field} />}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="otherLink">Website/Portfolio</Label>
              <Controller
                name="otherLink"
                control={control}
                render={({ field }) => <Input id="otherLink" placeholder="https://your.site" {...field} />}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
    