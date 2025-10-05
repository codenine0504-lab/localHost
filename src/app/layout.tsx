
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { InstallPwaButton } from '@/components/install-pwa-button';
import { AuthProvider } from '@/components/auth-provider';
import AppLayout from '@/components/app-layout';
import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// This metadata is now static and won't be dynamically changed
// export const metadata: Metadata = {
//   title: 'LocalHost',
//   description: 'Connect, Collaborate, Innovate. Your next great idea starts here!',
//   manifest: '/manifest.json',
//   icons: {
//     icon: '/favicon.svg',
//     apple: '/icon-192x192.png',
//   },
// };

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { toast } = useToast();

  useEffect(() => {
    requestForToken();

    const unsubscribe = onMessageListener().then((payload: any) => {
        toast({
            title: payload.notification.title,
            description: payload.notification.body,
        });
    });
    
    // Type assertion for cleanup
    return () => {
        (unsubscribe as Promise<() => void>).then(f => f()).catch(console.error);
    }
  }, [toast]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>LocalHost</title>
        <meta name="description" content="Connect, Collaborate, Innovate. Your next great idea starts here!" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </AuthProvider>
      </body>
    </html>
  );
}

export default RootLayout;
