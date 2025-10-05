
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/types';

interface JoinRequest {
    id: string;
    projectId: string;
    userId: string;
    userDisplayName: string | null;
    userPhotoURL: string | null;
    status: 'pending' | 'approved' | 'declined';
}

export function useJoinRequests(userId: string | undefined) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setRequests([]);
      return;
    }

    setLoading(true);
    
    // Query for projects where the user is an admin
    const projectsQuery = query(
      collection(db, 'projects'),
      where('admins', 'array-contains', userId)
    );
    const privateProjectsQuery = query(
      collection(db, 'privateProjects'),
      where('admins', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(projectsQuery, async (snapshot) => {
        const projectIds = snapshot.docs.map(doc => doc.id);
        
        const privateSnapshot = await getDocs(privateProjectsQuery);
        const privateProjectIds = privateSnapshot.docs.map(doc => doc.id);

        const allAdminProjectIds = [...new Set([...projectIds, ...privateProjectIds])];

        if (allAdminProjectIds.length === 0) {
            setRequests([]);
            setLoading(false);
            return;
        }

        // Now, listen for join requests for those projects
        const requestsQuery = query(
            collection(db, 'joinRequests'),
            where('projectId', 'in', allAdminProjectIds),
            where('status', '==', 'pending')
        );

        const requestsUnsubscribe = onSnapshot(requestsQuery, (requestSnapshot) => {
            const pendingRequests = requestSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as JoinRequest));
            setRequests(pendingRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching join requests:", error);
            setLoading(false);
        });

        return () => requestsUnsubscribe();

    }, (error) => {
        console.error("Error fetching admin projects:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { requests, loading };
}
