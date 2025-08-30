
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'LocalHost',
  description: 'Connect, Collaborate, Innovate. Your next great idea starts here!',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><polygon points=%2250,5 95,35 95,75 50,95 5,75 5,35%22 style=%22stroke:green;stroke-width:10;fill:none;%22/></svg>" />
        <link rel="apple-touch-icon" href="/localHost.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#38A3A5" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
         <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <div className="relative flex min-h-screen flex-col bg-background">
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
               <Footer />
            </div>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
