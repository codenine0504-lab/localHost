
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
import { db, auth, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  theme: z.enum(['software', 'hardware', 'event', 'design']),
  description: z.string().min(1, 'Description is required.'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function HostProjectDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      theme: 'software',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  
  const handleReset = () => {
    reset();
    setImageFile(null);
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
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    if (!user) {
        toast({ title: "Not Logged In", description: "You must be logged in to host a project.", variant: "destructive" });
        return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const college = userDoc.exists() ? userDoc.data().college : "Unknown College";

      // Create project document first to get an ID
      const projectDocRef = await addDoc(collection(db, 'projects'), {
        ...data,
        createdAt: serverTimestamp(),
        college: college, 
        owner: user.uid,
        imageUrl: '', // temporary empty value
      });
      
      let imageUrl = '';
      if (imageFile) {
        const imageRef = ref(storage, `project/${projectDocRef.id}/${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
        
        // Update project with the full download URL
        await updateDoc(projectDocRef, { imageUrl: imageUrl });
      }

      await setDoc(doc(db, 'chatRooms', projectDocRef.id), {
        name: data.title,
        createdAt: serverTimestamp(),
        imageUrl: imageUrl,
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
               <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea id="description" placeholder="Describe your project" className="col-span-1 sm:col-span-3" {...field} />
                )}
              />
              {errors.description && <p className="col-span-1 sm:col-span-4 text-red-500 text-xs text-center">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="upload" className="sm:text-right">
                Image
              </Label>
              <Input id="upload" type="file" className="col-span-1 sm:col-span-3" onChange={handleFileChange} accept="image/*" />
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
