
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectDetailsDialog } from '@/components/project-details-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';

interface Project {
  id: string;
  title: string;
  description: string;
  theme: string;
  college: string;
  imageUrl?: string;
  isPrivate?: boolean;
  requiresRequestToJoin?: boolean;
  budget?: number;
  owner: string;
  isAssigned?: boolean;
}

function ProjectPageSkeleton() {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
                <Skeleton className="h-64 w-full mb-6" />
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex justify-end gap-2 mt-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>
        </div>
    );
}

export default function ProjectPage() {
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;

            try {
                setLoading(true);
                let projectData;
                let projectDoc;
                const projectDocRef = doc(db, 'projects', projectId);
                projectDoc = await getDoc(projectDocRef);

                if (projectDoc.exists()) {
                    projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
                } else {
                    const privateProjectDocRef = doc(db, 'privateProjects', projectId);
                    projectDoc = await getDoc(privateProjectDocRef);

                    if (projectDoc.exists()) {
                         projectData = { id: privateProjectDoc.id, ...projectDoc.data() } as Project;
                    } else {
                        setError('Project not found.');
                        setLoading(false);
                        return;
                    }
                }
                
                const data = projectDoc.data();
                if (data?.isPrivate) {
                    if (!user || !data.members.includes(user.id)) {
                         setError('This is a private project. You do not have access.');
                         setLoading(false);
                         return;
                    }
                }
                
                setProject(projectData);
                setIsDialogOpen(true);
            } catch (err) {
                console.error("Error fetching project:", err);
                setError('Failed to load project details.');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, user]);

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        router.push('/projects');
    }

    return (
        <>
            
            {loading && <ProjectPageSkeleton />}
            {error && (
                <div className="container mx-auto py-12 text-center">
                    <p className="text-destructive">{error}</p>
                     <Button onClick={() => router.push('/projects')} className="mt-4">Back to Projects</Button>
                </div>
            )}
            {project && (
                 <ProjectDetailsDialog
                    project={project}
                    open={isDialogOpen}
                    onOpenChange={handleDialogClose}
                 >
                    {/* Trigger is not needed as we control state */}
                 </ProjectDetailsDialog>
            )}
        </>
    );
}
