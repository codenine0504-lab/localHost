
'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
import { Pencil, Loader2, Trash2, UserPlus, Check, X, Shield, MoreVertical, UserX, Link2, Settings, Users, IndianRupee } from 'lucide-react';
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
    requiresRequestToJoin?: boolean;
    budget?: number;
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
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description);
    const [imageUrl, setImageUrl] = useState(project.imageUrl || '');
    const [budget, setBudget] = useState<number | null | undefined>(project.budget);
    const [isDeleting, setIsDeleting] = useState(false);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const { toast } = useToast();
    const router = useRouter();


    const isCurrentUserAdmin = currentUser ? project.admins?.includes(currentUser.uid) ?? false : false;

    useEffect(() => {
        if (!isCurrentUserAdmin || (!project.isPrivate && !project.requiresRequestToJoin)) {
            setJoinRequests([]); // Clear requests if user is not admin or not applicable
            return;
        }

        const q = query(
            collection(db, 'joinRequests'),
            where('projectId', '==', project.id),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JoinRequest));
            setJoinRequests(requests);
        }, (error) => {
            console.error("Error fetching join requests:", error);
            toast({ title: "Error", description: "Could not fetch join requests.", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [isCurrentUserAdmin, project.id, project.isPrivate, project.requiresRequestToJoin, toast]);

    const handleUpdate = async (field: 'title' | 'description' | 'imageUrl' | 'budget') => {
        try {
            const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
            const projectRef = doc(db, projectCollection, project.id);
            const chatRoomRef = doc(db, 'chatRooms', project.id);

            let updateData: any = {};
            if (field === 'title') {
                updateData = { title };
                await updateDoc(chatRoomRef, { name: title });
                setIsEditingTitle(false);
            } else if (field === 'description') {
                updateData = { description };
                setIsEditingDesc(false);
            } else if (field === 'imageUrl') {
                updateData = { imageUrl };
                await updateDoc(chatRoomRef, { imageUrl });
                setIsEditingImageUrl(false);
            } else if (field === 'budget') {
                updateData = { budget: budget === undefined ? null : budget };
                setIsEditingBudget(false);
            }
            
            await updateDoc(projectRef, updateData);

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
                const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
                const projectRef = doc(db, projectCollection, project.id);
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
    
    const handleSettingToggle = async (setting: 'isPrivate' | 'requiresRequestToJoin', value: boolean) => {
        if (!isCurrentUserAdmin) return;
        setIsProcessing(true);

        try {
            const currentCollection = project.isPrivate ? 'privateProjects' : 'projects';
            const projectRef = doc(db, currentCollection, project.id);

            if (setting === 'isPrivate') {
                const fromCollection = value ? 'projects' : 'privateProjects';
                const toCollection = value ? 'privateProjects' : 'projects';
                
                if (fromCollection === toCollection) { // No change needed
                    setIsProcessing(false);
                    return;
                }

                const projectDocRef = doc(db, fromCollection, project.id);
                const projectDoc = await getDoc(projectDocRef);

                if (!projectDoc.exists()) throw new Error("Project document not found.");

                const projectData = projectDoc.data();
                projectData.isPrivate = value;
                projectData.requiresRequestToJoin = value ? true : projectData.requiresRequestToJoin || false;
                
                if (value && !projectData.members) {
                    projectData.members = [project.owner];
                }

                await setDoc(doc(db, toCollection, project.id), projectData);
                await deleteDoc(projectDocRef);
                await updateDoc(doc(db, 'chatRooms', project.id), { isPrivate: value });

                toast({ title: "Success", description: `Project visibility updated to ${value ? 'Private' : 'Public'}.` });
            } else { // requiresRequestToJoin
                 await updateDoc(projectRef, { requiresRequestToJoin: value });
                 toast({ title: "Success", description: `Join requests are now ${value ? 'required' : 'not required'}.` });
            }
            onProjectUpdate();
        } catch (error) {
            console.error("Error updating setting:", error);
            toast({ title: "Error", description: "Could not update project setting.", variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!isCurrentUserAdmin) return;
        setIsDeleting(true);

        try {
            if (project.imageUrl && project.imageUrl.includes('firebasestorage.googleapis.com')) {
                 try {
                    const imageRef = ref(storage, project.imageUrl);
                    await deleteObject(imageRef);
                } catch(e) {
                     console.warn("Could not delete project image:", e)
                }
            }

            const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
            await deleteDoc(doc(db, projectCollection, project.id));
            await deleteDoc(doc(db, 'chatRooms', project.id));

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
        if (!isCurrentUserAdmin || memberId === project.owner) return;

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
        if (!isCurrentUserAdmin || memberId === project.owner) return;

        const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
        const projectRef = doc(db, projectCollection, project.id);

        try {
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
    
     const handleShare = async () => {
        const shareUrl = `${window.location.origin}/chatroom/${project.id}`;
        const shareData = {
            title: `Join my project: ${project.title}`,
            text: `Join "${project.title}" on LocalHost!`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast({
                    title: 'Link Copied',
                    description: 'Project invitation link copied to clipboard.',
                });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            toast({
                title: 'Error',
                description: 'Could not share the project link.',
                variant: 'destructive',
            });
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
                 <SheetHeader className="text-center p-4 border-b">
                    <SheetTitle>{project.title}</SheetTitle>
                    <SheetDescription>Project details and settings</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-8">

                    {/* Project Settings Section */}
                    {isCurrentUserAdmin && (
                        <div className="space-y-4 px-4">
                            <h3 className="font-semibold text-lg flex items-center"><Settings className="mr-2 h-5 w-5" /> Project Settings</h3>
                            
                            {/* Image URL */}
                            <div className="space-y-2">
                                <Label>Image URL</Label>
                                {isEditingImageUrl ? (
                                    <div className="flex items-center gap-2">
                                        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
                                        <Button onClick={() => handleUpdate('imageUrl')} size="sm">Save</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditingImageUrl(false)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between group">
                                        <p className="text-sm text-muted-foreground truncate">{project.imageUrl || 'No image URL set'}</p>
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditingImageUrl(true)} className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Project Title */}
                            <div className="space-y-2">
                                <Label>Title</Label>
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-2">
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                                        <Button onClick={() => handleUpdate('title')} size="sm">Save</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between group">
                                        <p className="text-sm text-muted-foreground">{project.title}</p>
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditingTitle(true)} className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Project Description */}
                            <div className="space-y-2">
                                <Label>Description</Label>
                                {isEditingDesc ? (
                                    <div className="flex flex-col gap-2">
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => handleUpdate('description')} size="sm">Save</Button>
                                            <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between group">
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditingDesc(true)} className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                             {/* Budget */}
                            <div className="space-y-2">
                                <Label>Budget</Label>
                                {isEditingBudget ? (
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-grow">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="number" 
                                                value={budget ?? ''} 
                                                onChange={(e) => setBudget(e.target.value === '' ? undefined : Number(e.target.value))}
                                                placeholder="e.g. 5000"
                                                className="pl-8"
                                            />
                                        </div>
                                        <Button onClick={() => handleUpdate('budget')} size="sm">Save</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditingBudget(false)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between group">
                                        <p className="text-sm text-muted-foreground">
                                            {project.budget ? `₹${project.budget.toLocaleString()}` : 'Not set'}
                                        </p>
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditingBudget(true)} className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Separator />

                             {/* Privacy and Join Settings */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="isPrivate" className="flex flex-col gap-1">
                                        <span>Project Visibility</span>
                                        <span className="text-xs font-normal text-muted-foreground">
                                             {project.isPrivate ? "Only approved members can join." : "Visible to everyone."}
                                        </span>
                                    </Label>
                                    <Switch id="isPrivate" checked={project.isPrivate} onCheckedChange={(val) => handleSettingToggle('isPrivate', val)} disabled={isProcessing} />
                                </div>
                                <div className={`flex items-center justify-between ${project.isPrivate ? 'opacity-50' : ''}`}>
                                    <Label htmlFor="requiresRequest" className="flex flex-col gap-1">
                                        <span>Require Requests to Join</span>
                                         <span className="text-xs font-normal text-muted-foreground">
                                            Users must request to join.
                                        </span>
                                    </Label>
                                    <Switch id="requiresRequest" checked={project.requiresRequestToJoin} onCheckedChange={(val) => handleSettingToggle('requiresRequestToJoin', val)} disabled={isProcessing || project.isPrivate} />
                                </div>
                                 {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>

                        </div>
                    )}
                    
                     <Separator />

                    {/* Member Management Section */}
                    <div className="space-y-4 px-4">
                        <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 h-5 w-5" /> Member Management</h3>
                        
                        <Button variant="outline" className="w-full" onClick={handleShare}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Invite Members
                         </Button>

                        {/* Join Requests */}
                        {isCurrentUserAdmin && (project.isPrivate || project.requiresRequestToJoin) && joinRequests.length > 0 && (
                            <div className="space-y-3 pt-4">
                                <h4 className="text-sm font-medium flex items-center text-muted-foreground">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Join Requests ({joinRequests.length})
                                </h4>
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
                                                <Button size="icon" variant="outline" className="h-8 w-8 border-green-500 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => handleRequestAction(req.id, req.userId, 'approve')} disabled={processingRequestId === req.id}>
                                                    {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-8 w-8 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleRequestAction(req.id, req.userId, 'decline')} disabled={processingRequestId === req.id}>
                                                    {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Members List */}
                        <div className="space-y-3 pt-4">
                             <h4 className="text-sm font-medium flex items-center text-muted-foreground">
                                Members ({members.length})
                            </h4>
                            <ul className="space-y-3">
                                {members.map(member => (
                                    <li key={member.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={member.photoURL || undefined} alt="Member avatar" />
                                                <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{member.displayName}</span>
                                                 <div className="flex items-center gap-1">
                                                    {member.id === project.owner && <Badge variant="secondary" className="text-xs">Owner</Badge>}
                                                    {member.isAdmin && member.id !== project.owner && <Badge className="text-xs">Admin</Badge>}
                                                 </div>
                                            </div>
                                        </div>
                                        {isCurrentUserAdmin && currentUser?.uid !== member.id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {member.isAdmin ? (
                                                        member.id !== project.owner && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Shield className="mr-2 h-4 w-4" />Remove as Admin</DropdownMenuItem></AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader><AlertDialogTitle>Remove Admin Privileges?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to remove admin privileges for this member?</AlertDialogDescription></AlertDialogHeader>
                                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleAdminToggle(member.id, false)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )
                                                    ) : (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Shield className="mr-2 h-4 w-4" />Make Admin</DropdownMenuItem></AlertDialogTrigger>
                             <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Make Member an Admin?</AlertDialogTitle><AlertDialogDescription>Admins can edit project details and manage members. Are you sure?</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleAdminToggle(member.id, true)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}

                                                    {member.id !== project.owner && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:bg-red-500/10 focus:text-red-600"><UserX className="mr-2 h-4 w-4" />Remove Member</DropdownMenuItem></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Remove Member?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the member from the project. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
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
                    </div>


                     {/* Delete Project */}
                    {isCurrentUserAdmin && (
                        <div className="pt-6 border-t border-destructive/20 px-4">
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
