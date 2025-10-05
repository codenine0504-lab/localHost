
import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

async function handleUserDocument(firebaseUser: User) {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        // Create a new user document if it doesn't exist
        await setDoc(userRef, {
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            createdAt: serverTimestamp(),
            status: 'active',
            skills: [],
            college: 'GEC',
        });
    }
}

export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        await handleUserDocument(result.user);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google: ", error);
        throw error;
    }
}

export async function signOut() {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
        throw error;
    }
}
