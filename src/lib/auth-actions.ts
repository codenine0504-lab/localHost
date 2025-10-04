
'use server';

import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile, 
    GoogleAuthProvider, 
    signInWithRedirect
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
        
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            photoURL: user.photoURL,
        }, { merge: true });

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
         if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            return { error: 'Invalid email or password.' };
        }
        return { error: error.message || 'An unexpected error occurred.' };
    }
}

export async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        // This begins the redirect flow. The result is handled on the client.
        await signInWithRedirect(auth, provider);
        // This function won't return a value here because of the redirect.
        // The result is handled by getRedirectResult() on the login page.
        return { success: "Redirecting for Google Sign-In..." };
    } catch (error: any) {
        console.error('Error during Google sign-in initiation:', error);
         if (error.code === 'auth/operation-not-supported-in-this-environment') {
            return { error: 'Google Sign-In is not supported in this environment. Please use email/password.' };
        }
        return { error: error.message || 'An unexpected error occurred during Google sign-in.' };
    }
};
