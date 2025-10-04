
'use client';

import { AuthDialog } from '@/components/auth-dialog';
import { useEffect } from 'react';

// This component is primarily a wrapper to present the AuthDialog.
// The dedicated page is useful for handling redirects or specific auth-related routes.
export default function LoginPage() {

  useEffect(() => {
    // A potential place to handle redirects in the future if needed,
    // but for now, the main purpose is to show the dialog.
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
             {/* The AuthDialog is now the main UI for this page */}
             {/* The trigger is a button, but we can have it open by default if we want */}
            <AuthDialog>
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Click below to log in or create an account.
                    </p>
                </div>
            </AuthDialog>
        </div>
    </div>
  );
}
