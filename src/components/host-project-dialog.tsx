
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
import { addDoc, collection, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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

export function HostProjectDialog() {
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
            description: "Please log in with Google to host a project.",
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

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const college = userDoc.exists() ? userDoc.data().college : "Unknown College";

      const collectionName = data.isPrivate ? 'privateProjects' : 'projects';
      
      const { isPrivate, ...projectData } = data;

      const projectPayload: any = {
        ...projectData,
        createdAt: serverTimestamp(),
        college: college, 
        owner: user.uid,
        admins: [user.uid], // Owner is automatically an admin
      }

      if (data.isPrivate) {
          projectPayload.members = [user.uid]; // Owner is automatically a member
      }

      const projectDocRef = await addDoc(collection(db, collectionName), projectPayload);

      await setDoc(doc(db, 'chatRooms', projectDocRef.id), {
        name: data.title,
        createdAt: serverTimestamp(),
        imageUrl: data.imageUrl,
        isPrivate: data.isPrivate,
      });

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
      toast({
        title: 'Error',
        description: 'Could not host your project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Host a project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Host a Project</DialogTitle>
            <DialogDescription>
              Fill in the details below to get your project listed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="sm:text-right">
                Title
              </Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input id="title" placeholder="Your project title" className="col-span-1 sm:col-span-3" {...field} />
                )}
              />
              {errors.title && <p className="col-span-1 sm:col-span-4 text-red-500 text-xs text-center">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="theme" className="sm:text-right">
                Theme
              </Label>
              <Controller
                name="theme"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="col-span-1 sm:col-span-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="sm:text-right">
                Description
              </Label>
               <div className="col-span-1 sm:col-span-3 space-y-2">
                 <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="description" placeholder="Describe your project" className="w-full" {...field} />
                  )}
                />
                 <div className="text-xs text-muted-foreground text-right">
                  <span className={cn(wordCount > 50 ? 'text-red-500' : '')}>{wordCount}</span>/50 words
                </div>
               </div>
              {errors.description && <p className="col-span-1 sm:col-start-2 sm:col-span-3 text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
               <Label htmlFor="imageUrl" className="sm:text-right">
                Image URL
              </Label>
               <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => (
                  <Input id="imageUrl" type="url" placeholder="https://example.com/image.png" className="col-span-1 sm:col-span-3" {...field} />
                )}
              />
              {errors.imageUrl && <p className="col-span-1 sm:col-span-4 text-red-500 text-xs text-center">{errors.imageUrl.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="isPrivate" className="sm:text-right">
                Visibility
              </Label>
                <div className="col-span-1 sm:col-span-3 flex items-center space-x-2">
                    <Controller
                        name="isPrivate"
                        control={control}
                        render={({ field }) => (
                            <>
                                <Switch
                                id="isPrivate"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                                <Label htmlFor="isPrivate">{field.value ? 'Private' : 'Public'}</Label>
                            </>
                        )}
                    />
                </div>
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Hosting...' : 'Host Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
