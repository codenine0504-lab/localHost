'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './auth-provider';
import { Loader2 } from 'lucide-react';

const suggestionSchema = z.object({
  suggestion: z.string().min(10, 'Suggestion must be at least 10 characters long.'),
});

type SuggestionFormValues = z.infer<typeof suggestionSchema>;

export function SuggestionDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionSchema),
  });

  const onSubmit = async (data: SuggestionFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to submit a suggestion.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addDoc(collection(db, 'suggestions'), {
        suggestion: data.suggestion,
        userId: user.id,
        userName: user.displayName,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Suggestion Submitted!',
        description: 'Thank you for your feedback.',
      });
      reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast({
        title: 'Submission Failed',
        description: 'Could not submit your suggestion. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
            Suggest a Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest a Feature</DialogTitle>
          <DialogDescription>
            Have an idea to improve LocalHost? We'd love to hear it!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suggestion">Your Suggestion</Label>
            <Textarea
              id="suggestion"
              placeholder="e.g., 'It would be cool to have...'"
              {...register('suggestion')}
              rows={5}
            />
            {errors.suggestion && (
              <p className="text-red-500 text-xs">{errors.suggestion.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
