
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedHeader } from "@/components/animated-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { signOut, signInWithGoogle } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, LogOut } from "lucide-react";

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    
    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            toast({
                title: "Signed In",
                description: "You have successfully signed in.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Sign in failed",
                description: "Could not sign in with Google. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            toast({
                title: "Signed Out",
                description: "You have been successfully signed out.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Sign out failed",
                description: "Could not sign out. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <>
            
            <div className="container mx-auto py-12 px-4 md:px-6">
                <AnimatedHeader 
                    title="Settings"
                    description="Manage your application settings."
                >
                </AnimatedHeader>
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>Manage your account and sign-in status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Button disabled className="w-full">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </Button>
                            ) : user ? (
                                <Button variant="outline" onClick={handleSignOut} className="w-full">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            ) : (
                                <Button onClick={handleSignIn} className="w-full">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In with Google
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
