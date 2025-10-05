
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, setDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './auth-provider';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  theme: z.enum(['software', 'hardware', 'event', 'design']),
  description: z.string()
    .min(1, 'Description is required.')
    .refine(value => value.split(/\s+/).filter(Boolean).length <= 50, {
      message: 'Description must be 50 words or less.'
    }),
  imageUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function HostProjectDialog({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      theme: 'software',
      imageUrl: '',
    },
  });

  const descriptionValue = watch('description');
  const wordCount = descriptionValue.split(/\s+/).filter(Boolean).length;

  const handleReset = () => {
    reset();
  }

  const handleDialogOpen = (open: boolean) => {
    if (!user) {
        toast({
            title: "Authentication Required",
            description: "You need to be logged in to host a project.",
            variant: "destructive"
        });
        return;
    }
    if (!open) {
       handleReset();
    }
    setIsOpen(open);
  }
  
  const onSubmit = async (data: ProjectFormValues) => {
    if (!user) {
        toast({
            title: "Authentication Required",
            description: "You need to be logged in to host a project.",
            variant: "destructive"
        });
        return;
    }
    try {
      const isPrivate = false; // Visibility switch removed
      const collectionName = isPrivate ? 'privateProjects' : 'projects';
      
      const projectPayload: any = {
        ...data,
        isPrivate,
        createdAt: serverTimestamp(),
        college: user.college || "Unknown College", 
        owner: user.id,
        admins: [user.id],
        members: [user.id], // Owner is always a member
        budget: null,
        requiresRequestToJoin: true,
        views: 0,
        applicantCount: 0,
      };

      const projectDocRef = await addDoc(collection(db, collectionName), projectPayload);

      const chatRoomRef = doc(db, 'ProjectChats', projectDocRef.id);
      const batch = writeBatch(db);

      batch.set(chatRoomRef, {
        name: data.title,
        createdAt: serverTimestamp(),
        imageUrl: data.imageUrl,
        isPrivate: isPrivate,
        members: [user.id]
      });

      await batch.commit();


      const audio = new Audio('/upload.mp3');
      audio.play();

      toast({
        title: 'Project Hosted!',
        description: 'Your project and chat room have been created.',
      });
      handleReset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error hosting project: ', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: 'Error Hosting Project',
        description: `Could not host your project. Please try again. Error: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm rounded-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Host a Project</DialogTitle>
            <DialogDescription>
              Fill in the details below to get your project listed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                        <Input id="title" placeholder="Your project title" {...field} />
                        )}
                    />
                    {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Controller
                        name="theme"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="theme">
                                <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="software">Software</SelectItem>
                                <SelectItem value="hardware">Hardware</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="design">Design</SelectItem>
                            </SelectContent>
                        </Select>
                        )}
                    />
                </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                Description
              </Label>
               <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="description" placeholder="Describe your project in 50 words or less." className="w-full" {...field} />
                  )}
                />
                 <div className="text-xs text-muted-foreground text-right">
                  <span className={cn(wordCount > 50 ? 'text-red-500' : '')}>{wordCount}</span>/50 words
                </div>
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
               <Label htmlFor="imageUrl">
                Image URL
              </Label>
               <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => (
                  <Input id="imageUrl" type="url" placeholder="Paste image URL here" {...field} />
                )}
              />
               <p className="text-xs text-muted-foreground">
                Need to host an image? Use{' '}
                <Link href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  postimages.org
                </Link>
                .
              </p>
              {errors.imageUrl && <p className="text-red-500 text-xs">{errors.imageUrl.message}</p>}
            </div>
            
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Hosting...' : 'Host Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
