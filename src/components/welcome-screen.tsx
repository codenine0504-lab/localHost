
'use client';

import { Button } from '@/components/ui/button';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, MessageCircle, User, Code } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import React, { useState } from 'react';
import Link from 'next/link';

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

const features = [
  {
    icon: <Layers className="h-8 w-8 text-white" />,
    title: 'Host & Join Projects',
    description: 'Create your own projects or discover and join exciting projects from others.',
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-white" />,
    title: 'Real-time Chat',
    description: 'Collaborate with team members seamlessly with integrated real-time chat.',
  },
  {
    icon: <User className="h-8 w-8 text-white" />,
    title: 'Customize Your Profile',
    description: 'Showcase your skills and college information on your personal profile.',
  },
  {
    icon: <Code className="h-8 w-8 text-white" />,
    title: 'Multiple Project Themes',
    description: 'Find or create projects in software, hardware, events, or design.',
  },
];


export function WelcomeScreen() {
    const [showFeatures, setShowFeatures] = useState(false);
    const plugin = React.useRef(
        Autoplay({ delay: 2500, stopOnInteraction: true })
    );

    const handleSkip = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error('Error during anonymous sign-in:', error);
        }
    };

    if (!showFeatures) {
        return (
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-x-hidden py-16">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#102E4A,transparent)]"></div>
                 <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                    <AnimatedLogo />
                    
                    <div className="mt-8">
                         <p className="text-lg text-slate-300 mb-2 tracking-widest">GECR presents</p>
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
                        onClick={() => setShowFeatures(true)}
                    >
                        Get Started
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-x-hidden py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#102E4A,transparent)]"></div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl p-4">
                <h2 className="text-3xl font-bold text-white mb-8">Features</h2>
                    <Carousel
                    plugins={[plugin.current]}
                    className="w-full"
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                >
                    <CarouselContent>
                        {features.map((feature, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                <div className="p-1">
                                    <Card className="bg-slate-900/50 border-slate-800">
                                        <CardContent className="flex flex-col items-center justify-center p-6 text-center h-48">
                                            {feature.icon}
                                            <h3 className="text-xl font-semibold text-white mt-4">{feature.title}</h3>
                                            <p className="text-slate-400 mt-2 text-sm">{feature.description}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                <div className="mt-8 flex gap-4">
                    <Button 
                        asChild
                        size="lg" 
                        className="bg-white text-black hover:bg-slate-200 transition-transform duration-300 ease-in-out hover:scale-105"
                    >
                        <Link href="/login">Login / Sign Up</Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="ghost"
                        className="text-white hover:bg-slate-800 hover:text-white"
                        onClick={handleSkip}
                    >
                        Skip
                    </Button>
                </div>
            </div>
        </div>
    );
}
