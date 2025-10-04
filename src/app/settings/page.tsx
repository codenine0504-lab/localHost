
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
    return (
        <>
            
            <div className="container mx-auto py-12 px-4 md:px-6">
                <div className="space-y-4 mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage your application settings.</p>
                </div>
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
