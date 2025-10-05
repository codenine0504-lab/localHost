
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/auth";
import { Building, User } from "lucide-react";
import { useRouter } from 'next/navigation';
import { AnimatedHeader } from "@/components/animated-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        // Redirect if user is already logged in
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleSignIn = async (role: 'student' | 'organization') => {
        try {
            await signInWithGoogle(role);
            toast({
                title: "Signed In",
                description: `You have successfully signed in as a ${role}.`,
            });
            router.push('/'); // Redirect to home page after sign-in
        } catch (error) {
            console.error(error);
            toast({
                title: "Sign in failed",
                description: "Could not sign in with Google. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 md:px-6 flex items-center justify-center min-h-screen">
            <div className="max-w-md w-full">
                <AnimatedHeader 
                    title="Join LocalHost"
                    description="Choose your role to get started."
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>Select how you'd like to join the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={() => handleSignIn('student')} className="w-full" size="lg">
                            <User className="mr-2 h-5 w-5" />
                            Sign in as a Student
                        </Button>
                        <Button onClick={() => handleSignIn('organization')} className="w-full" variant="secondary" size="lg">
                            <Building className="mr-2 h-5 w-5" />
                            Sign in as an Organization
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
