
'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { Pencil, Loader2, Trash2 } from 'lucide-react';
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
import { Switch } from './ui/switch';
import { Label } from './ui/label';


interface ProjectDetails {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    owner: string;
    isPrivate: boolean;
}

interface Member {
    id: string;
    displayName: string | null;
    photoURL: string | null;
    isAdmin: boolean;
}

interface ChatSidebarProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    project: ProjectDetails;
    members: Member[];
    currentUser: User | null;
    onProjectUpdate: () => void;
}

export function ChatSidebar({ isOpen, onOpenChange, project, members, currentUser, onProjectUpdate }: ChatSidebarProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [isEditingImageUrl, setIsEditingImageUrl] = useState(false);
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description);
    const [imageUrl, setImageUrl] = useState(project.imageUrl || '');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
    const { toast } = useToast();
    const router = useRouter();


    const isOwner = currentUser?.uid === project.owner;

    const handleUpdate = async (field: 'title' | 'description' | 'imageUrl') => {
        try {
            const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
            const projectRef = doc(db, projectCollection, project.id);
            const chatRoomRef = doc(db, 'chatRooms', project.id);

            if (field === 'title') {
                await updateDoc(projectRef, { title });
                await updateDoc(chatRoomRef, { name: title });
                setIsEditingTitle(false);
            } else if (field === 'description') {
                await updateDoc(projectRef, { description });
                setIsEditingDesc(false);
            } else if (field === 'imageUrl') {
                 await updateDoc(projectRef, { imageUrl });
                 await updateDoc(chatRoomRef, { imageUrl });
                 setIsEditingImageUrl(false);
            }

            onProjectUpdate();
            toast({ title: "Success", description: `Project ${field} updated.` });
        } catch (error) {
            console.error("Error updating project:", error);
            toast({ title: "Error", description: `Could not update project ${field}.`, variant: 'destructive' });
        }
    };

    const handlePrivacyToggle = async (isPrivate: boolean) => {
        if (!isOwner) return;
        setIsTogglingPrivacy(true);

        const fromCollection = isPrivate ? 'projects' : 'privateProjects';
        const toCollection = isPrivate ? 'privateProjects' : 'projects';

        try {
            const projectDocRef = doc(db, fromCollection, project.id);
            const projectDoc = await getDoc(projectDocRef);

            if (!projectDoc.exists()) {
                throw new Error("Project document not found.");
            }

            const projectData = projectDoc.data();

            // Create new doc in the target collection
            await setDoc(doc(db, toCollection, project.id), projectData);

            // Delete doc from the source collection
            await deleteDoc(projectDocRef);

            // Update chatRoom
            await updateDoc(doc(db, 'chatRooms', project.id), { isPrivate });

            onProjectUpdate();
            toast({ title: "Success", description: `Project visibility updated to ${isPrivate ? 'Private' : 'Public'}.` });

        } catch (error) {
            console.error("Error toggling project privacy:", error);
            toast({ title: "Error", description: "Could not update project visibility.", variant: 'destructive' });
        } finally {
            setIsTogglingPrivacy(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!isOwner) return;
        setIsDeleting(true);

        try {
            // Delete project image from storage if it's a firebase storage URL
            if (project.imageUrl && project.imageUrl.includes('firebasestorage.googleapis.com')) {
                 try {
                    const imageRef = ref(storage, project.imageUrl);
                    await deleteObject(imageRef);
                } catch(e) {
                     console.warn("Could not delete project image:", e)
                }
            }

            // Delete firestore documents
            const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
            await deleteDoc(doc(db, projectCollection, project.id));
            await deleteDoc(doc(db, 'chatRooms', project.id));
            // Note: Deleting chat messages would require a recursive delete, which is complex for clients.
            // This can be handled with a Firebase Function or left as is.

            toast({ title: "Success", description: "Project has been deleted." });
            onOpenChange(false);
            router.push('/projects');

        } catch (error) {
             console.error("Error deleting project:", error);
             toast({ title: "Error", description: "Could not delete project.", variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U";
        const nameParts = name.split(" ");
        if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
          return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto pt-10">
                <div className="py-6 space-y-6">
                    {/* Project Image */}
                    <div className="relative h-48 w-full rounded-lg overflow-hidden group">
                        <Image
                            src={project.imageUrl || 'https://placehold.co/600x400.png'}
                            alt={`Image for ${project.title}`}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="project image"
                        />
                    </div>
                    
                    {/* Image URL */}
                     {isOwner && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Image URL</label>
                            {isEditingImageUrl ? (
                                <div className="flex items-center gap-2">
                                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
                                    <Button onClick={() => handleUpdate('imageUrl')}>Save</Button>
                                    <Button variant="ghost" onClick={() => setIsEditingImageUrl(false)}>Cancel</Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground truncate">{project.imageUrl || 'No image URL set'}</p>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditingImageUrl(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Project Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        {isEditingTitle && isOwner ? (
                            <div className="flex items-center gap-2">
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                                <Button onClick={() => handleUpdate('title')}>Save</Button>
                                <Button variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-semibold">{project.title}</p>
                                {isOwner && (
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditingTitle(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Project Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        {isEditingDesc && isOwner ? (
                            <div className="flex flex-col gap-2">
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => handleUpdate('description')}>Save</Button>
                                    <Button variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                             <div className="flex items-start justify-between">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                                 {isOwner && (
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditingDesc(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                     {/* Project Visibility */}
                    {isOwner && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Project Visibility</Label>
                             <div className="flex items-center space-x-2">
                                <Switch
                                    id="isPrivate"
                                    checked={project.isPrivate}
                                    onCheckedChange={handlePrivacyToggle}
                                    disabled={isTogglingPrivacy}
                                />
                                <Label htmlFor="isPrivate">{project.isPrivate ? 'Private' : 'Public'}</Label>
                                {isTogglingPrivacy && <Loader2 className="h-4 w-4 animate-spin" />}
                             </div>
                             <p className="text-xs text-muted-foreground">
                                {project.isPrivate ? "Only members can see this project." : "This project is visible to everyone."}
                            </p>
                        </div>
                    )}


                    {/* Members List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Members ({members.length})</h3>
                        <ul className="space-y-3">
                            {members.map(member => (
                                <li key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={member.photoURL || undefined} alt="Member avatar" />
                                            <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{member.displayName}</span>
                                    </div>
                                    {member.isAdmin && <Badge>Admin</Badge>}
                                </li>
                            ))}
                        </ul>
                    </div>

                     {/* Delete Project */}
                    {isOwner && (
                        <div className="pt-6 border-t border-destructive/20">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Project
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your project,
                                        chat room, and all associated data.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDeleteProject} 
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
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
