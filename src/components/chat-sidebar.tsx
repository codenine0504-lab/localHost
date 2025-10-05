
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
import { doc, updateDoc, deleteDoc, getDoc, setDoc, collection, query, where, onSnapshot, arrayUnion, arrayRemove, increment, getDocs, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
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

interface ChatSidebarProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    project: ProjectDetails;
    members: Member[];
    onProjectUpdate: () => void;
}

export function ChatSidebar({ isOpen, onOpenChange, project, members, onProjectUpdate }: ChatSidebarProps) {
    const [isEditing, setIsEditing] = useState({
        title: false,
        description: false,
        imageUrl: false,
        budget: false,
    });
    const [formState, setFormState] = useState({
        title: project.title,
        description: project.description,
        imageUrl: project.imageUrl || '',
        budget: project.budget,
    });
    
    const [isDeleting, setIsDeleting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        setFormState({
            title: project.title,
            description: project.description,
            imageUrl: project.imageUrl || '',
            budget: project.budget,
        });
    }, [project]);


    const handleInputChange = (field: keyof typeof formState, value: string | number | undefined) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdate = async (field: keyof typeof formState) => {
        setIsEditing(prev => ({...prev, [field]: false}))
        try {
            const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
            const projectRef = doc(db, projectCollection, project.id);
            const chatRoomRef = doc(db, 'ProjectChats', project.id);
            
            let updateData: any = { [field]: formState[field] };
            
            if (field === 'budget') {
                 updateData = { budget: formState.budget === undefined ? null : formState.budget };
            }

            if (field === 'title') {
                await updateDoc(chatRoomRef, { name: formState.title });
            }
             if (field === 'imageUrl') {
                await updateDoc(chatRoomRef, { imageUrl: formState.imageUrl });
            }
            
            await updateDoc(projectRef, updateData);

            onProjectUpdate();
            toast({ title: "Success", description: `Project ${field} updated.` });
        } catch (error) {
            console.error("Error updating project:", error);
            toast({ title: "Error", description: `Could not update project ${field}.`, variant: 'destructive' });
        }
    };
    
    const handleCancelEdit = (field: keyof typeof isEditing) => {
        setIsEditing(prev => ({ ...prev, [field]: false }));
        setFormState({
            title: project.title,
            description: project.description,
            imageUrl: project.imageUrl || '',
            budget: project.budget,
        });
    };
    
    const handleSettingToggle = async (setting: 'isPrivate', value: boolean) => {
        setIsProcessing(true);

        try {
            const currentCollection = project.isPrivate ? 'privateProjects' : 'projects';
            const projectRef = doc(db, currentCollection, project.id);

            if (setting === 'isPrivate') {
                const fromCollection = value ? 'projects' : 'privateProjects';
                const toCollection = value ? 'privateProjects' : 'projects';
                
                if (fromCollection === toCollection) { 
                    setIsProcessing(false);
                    return;
                }

                const projectDocRef = doc(db, fromCollection, project.id);
                const projectDoc = await getDoc(projectDocRef);

                if (!projectDoc.exists()) throw new Error("Project document not found.");

                const projectData = projectDoc.data();
                projectData.isPrivate = value;
                projectData.requiresRequestToJoin = true; 
                
                if (value && !projectData.members) {
                    projectData.members = [project.owner];
                }

                await setDoc(doc(db, toCollection, project.id), projectData);
                await deleteDoc(projectDocRef);
                await updateDoc(doc(db, 'ProjectChats', project.id), { isPrivate: value });

                toast({ title: "Success", description: `Project visibility updated to ${value ? 'Private' : 'Public'}.` });
            } 
            onProjectUpdate();
        } catch (error) {
            console.error("Error updating setting:", error);
            toast({ title: "Error", description: "Could not update project setting.", variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const deleteSubcollection = async (collectionRef: any) => {
        const querySnapshot = await getDocs(collectionRef);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    };

    const handleDeleteProject = async () => {
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
            
            const chatRoomRef = doc(db, 'ProjectChats', project.id);
            const messagesRef = collection(chatRoomRef, 'messages');
            
            await deleteSubcollection(messagesRef);
            await deleteDoc(chatRoomRef);

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
        if (memberId === project.owner) return;

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
        if (memberId === project.owner) return;

        const projectCollection = project.isPrivate ? 'privateProjects' : 'projects';
        const projectRef = doc(db, projectCollection, project.id);
        const chatRef = doc(db, 'ProjectChats', project.id);

        try {
            const batch = writeBatch(db);
            batch.update(projectRef, { 
                members: arrayRemove(memberId),
                admins: arrayRemove(memberId) 
            });
            batch.update(chatRef, { 
                members: arrayRemove(memberId)
            });
            await batch.commit();

            toast({ title: "Success", description: "Member has been removed from the project." });
            onProjectUpdate();
        } catch(error) {
            console.error("Error removing member:", error);
            toast({ title: "Error", description: "Could not remove member.", variant: "destructive" });
        }
    };
    
     const handleShare = async () => {
        const shareUrl = `${window.location.origin}/projects/${project.id}`;
        const shareData = {
            title: `Check out projects on LocalHost!`,
            text: `Join and collaborate on projects on LocalHost!`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast({
                    title: 'Link Copied',
                    description: 'Projects page link copied to clipboard.',
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
                    <div className="space-y-4 px-4">
                        <h3 className="font-semibold text-lg flex items-center"><Settings className="mr-2 h-5 w-5" /> Project Settings</h3>
                        
                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            {isEditing.imageUrl ? (
                                <div className="flex items-center gap-2">
                                    <Input value={formState.imageUrl} onChange={(e) => handleInputChange('imageUrl', e.target.value)} placeholder="https://example.com/image.png" />
                                    <Button onClick={() => handleUpdate('imageUrl')} size="sm">Save</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleCancelEdit('imageUrl')}>Cancel</Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between group">
                                    <p className="text-sm text-muted-foreground truncate">{project.imageUrl || 'No image URL set'}</p>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(prev => ({...prev, imageUrl: true}))} className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Project Title */}
                        <div className="space-y-2">
                            <Label>Title</Label>
                            {isEditing.title ? (
                                <div className="flex items-center gap-2">
                                    <Input value={formState.title} onChange={(e) => handleInputChange('title', e.target.value)} />
                                    <Button onClick={() => handleUpdate('title')} size="sm">Save</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleCancelEdit('title')}>Cancel</Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between group">
                                    <p className="text-sm text-muted-foreground">{project.title}</p>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(prev => ({...prev, title: true}))} className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Project Description */}
                        <div className="space-y-2">
                            <Label>Description</Label>
                            {isEditing.description ? (
                                <div className="flex flex-col gap-2">
                                    <Textarea value={formState.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={5} />
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleUpdate('description')} size="sm">Save</Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleCancelEdit('description')}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between group">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(prev => ({...prev, description: true}))} className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                         {/* Budget */}
                        <div className="space-y-2">
                            <Label>Budget</Label>
                            {isEditing.budget ? (
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-grow">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            type="number" 
                                            value={formState.budget ?? ''} 
                                            onChange={(e) => handleInputChange('budget', e.target.value === '' ? undefined : Number(e.target.value))}
                                            placeholder="e.g. 5000"
                                            className="pl-8"
                                        />
                                    </div>
                                    <Button onClick={() => handleUpdate('budget')} size="sm">Save</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleCancelEdit('budget')}>Cancel</Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between group">
                                    <p className="text-sm text-muted-foreground">
                                        {project.budget ? `₹${project.budget.toLocaleString()}` : 'Not set'}
                                    </p>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(prev => ({...prev, budget: true}))} className="h-7 w-7 opacity-0 group-hover:opacity-100">
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
                             {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>

                    </div>
                    
                     <Separator />

                    {/* Member Management Section */}
                    <div className="space-y-4 px-4">
                        <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 h-5 w-5" /> Member Management</h3>
                        
                        <Button variant="outline" className="w-full" onClick={handleShare}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Invite Members
                         </Button>

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
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>


                     {/* Delete Project */}
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
                </div>
            </SheetContent>
        </Sheet>
    );
}
