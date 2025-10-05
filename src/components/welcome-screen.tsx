
'use client';

import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, MessageCircle, Users, Search } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithGoogle } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface WelcomeScreenProps {
  onFinish: () => void;
}

const AnimatedLogo = () => (
    <div className="relative w-48 h-48 md:w-64 md:h-64 animate-float">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-2xl opacity-50 animate-pulse"></div>
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

const features = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Find Your Team",
      description: "Connect with people who have the skills you need.",
    },
    {
      icon: <Layers className="h-8 w-8 text-primary" />,
      title: "Launch Your Vision",
      description: "Host your own project and bring your ideas to life.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Join a Project",
      description: "Explore existing projects and contribute your skills.",
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "Collaborate Instantly",
      description: "Use real-time chat to work with your collaborators.",
    },
  ];


export function WelcomeScreen({ onFinish }: WelcomeScreenProps) {
    const [step, setStep] = useState(0);
    const { toast } = useToast();
    const plugin = React.useRef(
        Autoplay({ delay: 2500, stopOnInteraction: true })
    );

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            onFinish();
        } catch (error) {
            console.error("Google sign-in error:", error);
            toast({
                title: "Sign-in Failed",
                description: "Could not sign in with Google. Please try again.",
                variant: "destructive"
            })
        }
    };

    if (step === 0) {
        return (
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background overflow-x-hidden py-16">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
                 <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                    <AnimatedLogo />
                    
                    <div className="mt-8">
                         <p className="text-lg text-muted-foreground mb-2 tracking-widest">A GEC startup</p>
                         <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                             Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-blue-500">LocalHost</span>
                         </h1>
                    </div>

                    <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                        The ultimate platform to connect with peers, build amazing projects, and bring your ideas to life.
                    </p>
                    
                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <Button 
                            size="lg" 
                            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-transform duration-300 ease-in-out hover:scale-105"
                            onClick={() => setStep(1)}
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background overflow-x-hidden py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl p-4">
                <h2 className="text-3xl font-bold text-foreground mb-8">Ready to Dive In?</h2>
                    <p className="text-muted-foreground text-center max-w-2xl mb-8">
                        Sign in to create your profile, host projects, and collaborate with a vibrant community. Or, feel free to look around as a guest.
                    </p>
                <div className="mt-8 flex gap-4">
                     <Button
                        size="lg"
                        className="bg-primary text-primary-foreground"
                        onClick={handleGoogleSignIn}
                    >
                        Sign in with Google
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={onFinish}
                    >
                        Skip for now
                    </Button>
                </div>
            </div>
        </div>
    );
}
