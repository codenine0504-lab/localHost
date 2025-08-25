'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc, setDoc, collection, query, where, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { Pencil, Loader2, Trash2, UserPlus, Check, X, Shield, MoreVertical, UserX } from 'lucide-react';
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
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface ProjectDetails {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    owner: string;
    isPrivate: boolean;
    admins?: string[];
}

interface Member {
    id: string;
    displayName: string | null;
    photoURL: string | null;
    isAdmin: boolean;
}

interface JoinRequest {
    id: string;
    userId: string;
    userDisplayName: string | null;
    userPhotoURL: string | null;
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
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();


    const isCurrentUserAdmin = currentUser ? project.admins?.includes(currentUser.uid) ?? false : false;

    useEffect(() => {
        if (!isCurrentUserAdmin || !project.id) return;

        const q = query(
            collection(db, 'joinRequests'),
            where('projectId', '==', project.id),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JoinRequest));
            setJoinRequests(requests);
        });

        return () => unsubscribe();
    }, [isCurrentUserAdmin, project.id]);

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

    const handleRequestAction = async (requestId: string, userId: string, action: 'approve' | 'decline') => {
        if (!isCurrentUserAdmin) return;
        setProcessingRequestId(requestId);

        const requestRef = doc(db, 'joinRequests', requestId);

        try {
            if (action === 'approve') {
                const projectRef = doc(db, 'privateProjects', project.id);
                await updateDoc(projectRef, {
                    members: arrayUnion(userId)
                });
                await updateDoc(requestRef, { status: 'approved' });
                toast({ title: 'User Approved', description: 'The user has been added to the project.' });
            } else {
                await updateDoc(requestRef, { status: 'declined' });
                toast({ title: 'User Declined', description: 'The join request has been declined.' });
            }
            onProjectUpdate(); // Re-fetch project members
        } catch(error) {
            console.error(`Error ${action === 'approve' ? 'approving' : 'declining'} request:`, error);
            toast({ title: "Error", description: "Could not process the request.", variant: 'destructive' });
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handlePrivacyToggle = async (isPrivate: boolean) => {
        if (!isCurrentUserAdmin) return;
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
            
            // Add owner to members list when making a project private for the first time
            if (isPrivate && !projectData.members) {
                projectData.members = [project.owner];
            }


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
        if (!isCurrentUserAdmin) return;
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
    
     const handleAdminToggle = async (memberId: string, shouldBeAdmin: boolean) => {
        if (!isCurrentUserAdmin || memberId === project.owner) return; // Owner cannot be demoted

        const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
        const projectRef = doc(db, projectCollection, project.id);

        try {
            if (shouldBeAdmin) {
                await updateDoc(projectRef, { admins: arrayUnion(memberId) });
                toast({ title: "Success", description: "Member promoted to admin." });
            } else {
                await updateDoc(projectRef, { admins: arrayRemove(memberId) });
                toast({ title: "Success", description: "Admin status revoked." });
            }
            onProjectUpdate();
        } catch (error) {
            console.error("Error updating admin status:", error);
            toast({ title: "Error", description: "Could not update admin status.", variant: "destructive" });
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!isCurrentUserAdmin || memberId === project.owner) return; // Owner cannot be removed

        const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
        const projectRef = doc(db, projectCollection, project.id);

        try {
            // Atomically remove from both members and admins arrays
            await updateDoc(projectRef, { 
                members: arrayRemove(memberId),
                admins: arrayRemove(memberId) 
            });
            toast({ title: "Success", description: "Member has been removed from the project." });
            onProjectUpdate();
        } catch(error) {
            console.error("Error removing member:", error);
            toast({ title: "Error", description: "Could not remove member.", variant: "destructive" });
        }
    };


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
                     {isCurrentUserAdmin && (
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
                        {isEditingTitle && isCurrentUserAdmin ? (
                            <div className="flex items-center gap-2">
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                                <Button onClick={() => handleUpdate('title')}>Save</Button>
                                <Button variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-semibold">{project.title}</p>
                                {isCurrentUserAdmin && (
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
                        {isEditingDesc && isCurrentUserAdmin ? (
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
                                 {isCurrentUserAdmin && (
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditingDesc(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                     {/* Project Visibility */}
                    {isCurrentUserAdmin && (
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
                                {project.isPrivate ? "Only approved members can join this project." : "This project is visible to everyone."}
                            </p>
                        </div>
                    )}
                    
                     {/* Join Requests */}
                    {isCurrentUserAdmin && project.isPrivate && joinRequests.length > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium flex items-center">
                                <UserPlus className="mr-2 h-5 w-5" />
                                Join Requests ({joinRequests.length})
                            </h3>
                            <ul className="space-y-3">
                                {joinRequests.map(req => (
                                    <li key={req.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={req.userPhotoURL || undefined} alt="User avatar" />
                                                <AvatarFallback>{getInitials(req.userDisplayName)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{req.userDisplayName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                                onClick={() => handleRequestAction(req.id, req.userId, 'approve')}
                                                disabled={processingRequestId === req.id}
                                            >
                                                {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </Button>
                                             <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                                onClick={() => handleRequestAction(req.id, req.userId, 'decline')}
                                                disabled={processingRequestId === req.id}
                                            >
                                                {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}


                    {/* Members List */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">Members ({members.length})</h3>
                        <ul className="space-y-3">
                             {members.map(member => (
                                <li key={member.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={member.photoURL || undefined} alt="Member avatar" />
                                            <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{member.displayName}</span>
                                        {member.id === project.owner && <Badge variant="secondary">Owner</Badge>}
                                        {member.isAdmin && member.id !== project.owner && <Badge>Admin</Badge>}
                                    </div>
                                    
                                     {isCurrentUserAdmin && currentUser?.uid !== member.id && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {member.isAdmin ? (
                                                     member.id !== project.owner && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    Remove as Admin
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Remove Admin Privileges?</AlertDialogTitle>
                                                                    <AlertDialogDescription>Are you sure you want to remove admin privileges for this member?</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleAdminToggle(member.id, false)}>Confirm</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )
                                                ) : (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                Make Admin
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Make Member an Admin?</AlertDialogTitle>
                                                                <AlertDialogDescription>Admins can edit project details and manage members. Are you sure?</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleAdminToggle(member.id, true)}>Confirm</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}

                                                {member.id !== project.owner && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:bg-red-500/10 focus:text-red-600">
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Remove Member
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                         <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently remove the member from the project. This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                     {/* Delete Project */}
                    {isCurrentUserAdmin && (
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
