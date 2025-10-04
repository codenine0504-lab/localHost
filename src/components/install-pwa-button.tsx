
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// TypeScript interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

export function InstallPwaButton() {
    const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        // Event listener for when the browser is ready to prompt for installation
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            // Store the event so it can be triggered later.
            setPrompt(e as BeforeInstall_installPromptEvent);
        };

        // Event listener for when the app is successfully installed
        const handleAppInstalled = () => {
            setIsAppInstalled(true);
             // Clear the prompt once installed
            setPrompt(null);
        };

        // Check if running in standalone mode (as a PWA)
        if (typeof window !== "undefined" && window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!prompt) return;
        // Show the browser's installation prompt
        await prompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
            setIsAppInstalled(true);
        }
        // We've used the prompt, so clear it
        setPrompt(null);
    };

    // Only show the button if the app is not installed and a prompt is available
    if (isAppInstalled || !prompt) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            <Button onClick={handleInstallClick} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Install App
            </Button>
        </div>
    );
}
