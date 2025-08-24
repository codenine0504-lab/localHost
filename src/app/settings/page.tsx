
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
    return (
        <>
            <Header />
            <div className="container mx-auto py-12 px-4 md:px-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                        <CardDescription>Manage your application settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode" className="text-lg">Appearance</Label>
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
