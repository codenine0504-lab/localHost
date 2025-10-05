
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, User, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AppUser } from '@/types';

interface DmChatSidebarProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    otherUser: AppUser;
    chatId: string;
}

export function DmChatSidebar({ isOpen, onOpenChange, otherUser, chatId }: DmChatSidebarProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U";
        const nameParts = name.split(" ");
        if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
          return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const deleteSubcollection = async (collectionRef: any) => {
        const querySnapshot = await getDocs(collectionRef);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    };

    const handleDeleteChat = async () => {
        setIsDeleting(true);
        try {
            const chatRoomRef = doc(db, 'General', chatId);
            const messagesRef = collection(chatRoomRef, 'messages');
            
            await deleteSubcollection(messagesRef);
            await deleteDoc(chatRoomRef);

            toast({ title: "Success", description: "Chat has been deleted." });
            onOpenChange(false);
            router.push('/chatroom');

        } catch (error) {
             console.error("Error deleting chat:", error);
             toast({ title: "Error", description: "Could not delete chat.", variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto pt-10">
                <SheetHeader className="text-center p-4 border-b items-center">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                        <AvatarImage src={otherUser.photoURL || undefined} alt="User avatar" />
                        <AvatarFallback>{getInitials(otherUser.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1 pt-4">
                        <div className="flex items-center gap-1.5 justify-center">
                            <SheetTitle className="text-xl break-all">{otherUser.displayName}</SheetTitle>
                            {otherUser.role === 'organization' && (
                                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            )}
                        </div>
                        {otherUser.status && otherUser.status !== 'none' && (
                            <Badge variant={otherUser.status === 'seeking' ? 'default' : 'secondary'} className="mx-auto">
                                {otherUser.status === 'seeking' ? 'Seeking Collaboration' : 'Actively Building'}
                            </Badge>
                        )}
                    </div>
                </SheetHeader>
                <div className="py-6 space-y-8 px-4">
                    
                    <div className='space-y-4'>
                        <p className="text-sm text-muted-foreground">{otherUser.bio || 'No bio provided.'}</p>
                        
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/profile/${otherUser.id}`}>
                                <User className="mr-2 h-4 w-4" /> View Full Profile
                            </Link>
                        </Button>
                    </div>

                     {/* Delete Chat */}
                    <div className="pt-6 border-t border-destructive/20">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Chat
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this chat history.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleDeleteChat} 
                                    disabled={isDeleting}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
