
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
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, setDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  theme: z.enum(['software', 'hardware', 'event', 'design']),
  description: z.string()
    .min(1, 'Description is required.')
    .refine(value => value.split(/\s+/).filter(Boolean).length <= 50, {
      message: 'Description must be 50 words or less.'
    }),
  imageUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  isPrivate: z.boolean().default(false),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function HostProjectDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
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
      isPrivate: false,
    },
  });

  const descriptionValue = watch('description');
  const wordCount = descriptionValue.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  
  const handleReset = () => {
    reset();
  }

  const handleDialogOpen = (open: boolean) => {
    if (open && !user) {
        toast({
            title: "Authentication Required",
            description: "Please log in to host a project.",
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
        toast({ title: "Not Logged In", description: "You must be logged in to host a project.", variant: "destructive" });
        return;
    }
    
    if (user.isAnonymous) {
         toast({ title: "Account Required", description: "Please create an account to host a project.", variant: "destructive" });
        return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() || !userDoc.data()?.college) {
        toast({
          title: "Profile Incomplete",
          description: "Please set your college on your profile page before hosting a project.",
          variant: "destructive"
        });
        return;
      }
      const college = userDoc.data().college;

      const collectionName = data.isPrivate ? 'privateProjects' : 'projects';
      
      const projectPayload: any = {
        ...data,
        createdAt: serverTimestamp(),
        college: college, 
        owner: user.uid,
        admins: [user.uid],
        members: [user.uid], // Owner is always a member
        budget: null,
        requiresRequestToJoin: true,
        views: 0,
        applicantCount: 0,
      };

      const projectDocRef = await addDoc(collection(db, collectionName), projectPayload);

      const chatRoomRef = doc(db, 'chatRooms', projectDocRef.id);
      const batch = writeBatch(db);

      batch.set(chatRoomRef, {
        name: data.title,
        createdAt: serverTimestamp(),
        imageUrl: data.imageUrl,
        isPrivate: data.isPrivate,
      });

      // Create dummy docs to ensure subcollections are created.
      const generalChatRef = doc(collection(chatRoomRef, 'General'));
      batch.set(generalChatRef, {});
      const teamChatRef = doc(collection(chatRoomRef, 'Team'));
      batch.set(teamChatRef, {});

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
      <DialogContent className="sm:max-w-md">
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
                  <Input id="imageUrl" type="url" placeholder="https://postimages.org/ a service to host image" {...field} />
                )}
              />
              {errors.imageUrl && <p className="text-red-500 text-xs">{errors.imageUrl.message}</p>}
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isPrivate">
                    Visibility
                </Label>
                 <p className="text-xs text-muted-foreground">
                    Private projects require admin approval to join.
                </p>
              </div>
                <Controller
                    name="isPrivate"
                    control={control}
                    render={({ field }) => (
                        <Switch
                        id="isPrivate"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    )}
                />
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
