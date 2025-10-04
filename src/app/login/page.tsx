
'use client';

import { AuthDialog } from '@/components/auth-dialog';
import { useEffect, useState } from 'react';
import { getRedirectResult, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          // User signed in.
          toast({ title: "Signed In", description: "Welcome back!" });

          // Check if user exists in DB, if not create them
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            }, { merge: true });
          }
          router.push('/');
        } else {
          setLoading(false);
        }
      } catch (error: any) {
        console.error("Error getting redirect result:", error);
        toast({
          title: "Sign-in Error",
          description: error.message || "Could not sign in with Google.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    handleRedirect();
  }, [router, toast]);

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Please wait...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
            <AuthDialog>
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Click below to log in or create an account.
                    </p>
                </div>
            </AuthDialog>
        </div>
    </div>
  );
}
