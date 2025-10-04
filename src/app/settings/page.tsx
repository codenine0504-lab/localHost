
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { AnimatedHeader } from "@/components/animated-header";

export default function SettingsPage() {
    return (
        <>
            
            <div className="container mx-auto py-12 px-4 md:px-6">
                <AnimatedHeader 
                    title="Settings"
                    description="Manage your application settings."
                />
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode" className="text-lg">Theme</Label>
                            <ThemeToggle />
                        </div>
                         <p className="text-sm text-muted-foreground">
                                Select between light and dark mode, or sync with your system preference.
                            </p>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
