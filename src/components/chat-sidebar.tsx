
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { Pencil } from 'lucide-react';

interface ProjectDetails {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    owner: string;
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
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description);
    const { toast } = useToast();

    const isOwner = currentUser?.uid === project.owner;

    const handleUpdate = async (field: 'title' | 'description') => {
        try {
            const projectRef = doc(db, 'projects', project.id);
            if (field === 'title') {
                await updateDoc(projectRef, { title });
                setIsEditingTitle(false);
            } else {
                await updateDoc(projectRef, { description });
                setIsEditingDesc(false);
            }
            // Also update the chatRoom name if title is changed
            if (field === 'title') {
                const chatRoomRef = doc(db, 'chatRooms', project.id);
                await updateDoc(chatRoomRef, { name: title });
            }
            onProjectUpdate();
            toast({ title: "Success", description: `Project ${field} updated.` });
        } catch (error) {
            console.error("Error updating project:", error);
            toast({ title: "Error", description: `Could not update project ${field}.`, variant: 'destructive' });
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
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Project Details</SheetTitle>
                    <SheetDescription>Information about this project and its members.</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    {/* Project Image */}
                    <div className="relative h-48 w-full rounded-lg overflow-hidden">
                        <Image
                            src={project.imageUrl || 'https://placehold.co/600x400.png'}
                            alt={`Image for ${project.title}`}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="project image"
                        />
                    </div>

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
                </div>
            </SheetContent>
        </Sheet>
    );
}
