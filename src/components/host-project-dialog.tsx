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
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  theme: z.enum(['software', 'hardware', 'event']),
  description: z.string().min(1, 'Description is required.'),
  // image validation is complex, skipping for now
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function HostProjectDialog() {
  const [isOpen, setIsOpen] = useState(false);
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

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      // Create project document
      const projectRef = await addDoc(collection(db, 'projects'), {
        ...data,
        createdAt: serverTimestamp(),
        // Hardcoding user/college for now, this should come from auth
        college: 'NIT Raipur', 
        owner: 'user1',
      });

      // Create a corresponding chat room
      await addDoc(collection(db, 'chatRooms'), {
        projectId: projectRef.id,
        name: data.title,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Project Hosted!',
        description: 'Your project and chat room have been created.',
      });
      reset();
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <Input id="upload" type="file" className="col-span-1 sm:col-span-3" />
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
