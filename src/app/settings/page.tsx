
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { AnimatedHeader } from "@/components/animated-header";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    
    const handleClearData = () => {
        localStorage.clear();
        window.location.reload();
    }

    return (
        <>
            
            <div className="container mx-auto py-12 px-4 md:px-6">
                <AnimatedHeader 
                    title="Settings"
                    description="Manage your application settings."
                >
                    <ThemeToggle />
                </AnimatedHeader>
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>Customize the look and feel of the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <p className="text-sm text-muted-foreground">
                                    You can change the theme using the toggle in the header. Select between light and dark mode.
                                </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Local Data</CardTitle>
                            <CardDescription>Manage data stored on your device.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground mb-4">
                                Clearing local data will reset your welcome screen experience and remove chat read receipts.
                            </p>
                            <Button variant="destructive" onClick={handleClearData}>Clear Local Data</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
