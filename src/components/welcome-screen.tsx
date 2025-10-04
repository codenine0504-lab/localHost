
'use client';

import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AnimatedLogo = () => (
    <div className="relative w-48 h-48 md:w-64 md:h-64 animate-float">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <svg
            className="relative w-full h-full"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fill="hsl(var(--primary))"
                d="M47.9,-70.7C61.4,-61.7,71.2,-46.8,77.3,-30.7C83.5,-14.7,86,2.5,80.7,17.2C75.4,31.9,62.3,44,48.5,55.5C34.7,67,20.2,77.8,2.7,79.5C-14.8,81.2,-32.3,73.8,-47,63.1C-61.7,52.4,-73.6,38.4,-78.9,22.2C-84.3,6,-83,-12.3,-75.8,-27.7C-68.6,-43.1,-55.5,-55.6,-41.2,-64.8C-26.9,-74,-11.4,-80,4.7,-82.2C20.8,-84.4,41.6,-83.9,47.9,-70.7Z"
                transform="translate(100 100)"
            />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-primary-foreground">
            LH
        </span>
    </div>
);

export function WelcomeScreen() {

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const loggedInUser = result.user;
            
            const userDocRef = doc(db, "users", loggedInUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    uid: loggedInUser.uid,
                    email: loggedInUser.email,
                    displayName: loggedInUser.displayName,
                    photoURL: loggedInUser.photoURL,
                }, { merge: true });
            }
        } catch (error) {
            console.error('Error during sign-in:', error);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-x-hidden py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#102E4A,transparent)]"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                <AnimatedLogo />
                
                <div className="mt-8">
                     <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-blue-400 to-purple-500">LocalHost</span>
                    </h1>
                </div>

                <p className="mt-6 max-w-lg text-lg text-slate-400">
                    The ultimate platform to connect with peers, build amazing projects, and bring your ideas to life.
                </p>

                <Button 
                    size="lg" 
                    className="mt-10 bg-white text-black hover:bg-slate-200 transition-transform duration-300 ease-in-out hover:scale-105"
                    onClick={handleGoogleLogin}
                >
                    Get Started
                </Button>
            </div>
        </div>
    );
}
