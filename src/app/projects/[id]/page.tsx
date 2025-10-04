
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectDetailsDialog } from '@/components/project-details-dialog';
import { Button } from '@/components/ui/button';

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
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;

            try {
                setLoading(true);
                const projectDocRef = doc(db, 'projects', projectId);
                const projectDoc = await getDoc(projectDocRef);

                if (projectDoc.exists()) {
                    setProject({ id: projectDoc.id, ...projectDoc.data() } as Project);
                } else {
                    const privateProjectDocRef = doc(db, 'privateProjects', projectId);
                    const privateProjectDoc = await getDoc(privateProjectDocRef);

                    if (privateProjectDoc.exists()) {
                         setProject({ id: privateProjectDoc.id, ...privateProjectDoc.data() } as Project);
                    } else {
                        setError('Project not found.');
                    }
                }
            } catch (err) {
                console.error("Error fetching project:", err);
                setError('Failed to load project details.');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    return (
        <>
            <Header />
            {loading && <ProjectPageSkeleton />}
            {error && (
                <div className="container mx-auto py-12 text-center">
                    <p className="text-destructive">{error}</p>
                     <Button onClick={() => router.push('/projects')} className="mt-4">Back to Projects</Button>
                </div>
            )}
            {project && (
                 <div className="container mx-auto py-12 px-4 md:px-6">
                    <ProjectDetailsDialog project={project}>
                       <></>
                    </ProjectDetailsDialog>
                    <div className="invisible absolute">
                        <ProjectDetailsDialog project={project}>
                            <div id="trigger" />
                        </ProjectDetailsDialog>
                    </div>
                 </div>
            )}
        </>
    );
}

// This is a bit of a hack to auto-trigger the dialog on page load.
const AutoTriggerDialog = () => {
    useEffect(() => {
        const trigger = document.getElementById('trigger');
        trigger?.click();
    }, []);
    return null;
}

    