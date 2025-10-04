
'use server';

import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { z } from 'zod';

const signUpSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address.'),
    password: z.string().min(1, 'Password is required.'),
});


export async function signUpWithEmail(values: z.infer<typeof signUpSchema>) {
    const validatedFields = signUpSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Invalid fields." };
    }
    
    const { email, password, displayName } = validatedFields.data;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });
        
        const batch = writeBatch(db);

        const userDocRef = doc(db, "users", user.uid);
        batch.set(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            photoURL: user.photoURL,
        }, { merge: true });

        // Ensure general chat room exists
        const generalChatRef = doc(db, 'chatRooms', 'general');
        const generalChatDoc = await getDoc(generalChatRef);
        if (!generalChatDoc.exists()) {
            batch.set(generalChatRef, { name: 'General Chat' });
        }
        
        await batch.commit();


        return { success: "User created successfully." };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { error: 'This email is already in use.' };
        }
        return { error: error.message || 'An unexpected error occurred.' };
    }
}


export async function loginWithEmail(values: z.infer<typeof loginSchema>) {
    const validatedFields = loginSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Invalid fields." };
    }
    
    const { email, password } = validatedFields.data;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: "Logged in successfully." };
    } catch (error: any) {
         if (error.code === 'auth/invalid-credential') {
            return { error: 'Invalid email or password.' };
        }
        return { error: error.message || 'An unexpected error occurred.' };
    }
}

export async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      // Switch to signInWithRedirect
      await signInWithRedirect(auth, provider);
      // The rest of the logic (creating user doc) is handled by Firebase's redirect result handling implicitly
      // or should be handled on the client-side after redirect. For now, just initiating the redirect is enough.
      return { success: "Redirecting to Google for sign-in..." };

    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
       return { error: error.message || 'An unexpected error occurred during Google sign-in.' };
    }
};
