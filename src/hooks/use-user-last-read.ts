
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LastRead {
  [chatId: string]: Timestamp;
}

export function useUserLastRead(userId: string | undefined) {
  const [lastRead, setLastRead] = useState<LastRead>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setLastRead({});
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLastRead(data.lastRead || {});
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lastRead data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { lastRead, loading };
}
