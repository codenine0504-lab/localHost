
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signUpWithEmail, loginWithEmail, loginWithGoogle } from '@/lib/auth-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeProvider } from '@/components/theme-provider';
import { getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


const signUpSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            }, { merge: true });
          }
          router.push('/');
        }
      } catch (error: any) {
        console.error("Error handling redirect result:", error);
        if (error.code === 'auth/operation-not-supported-in-this-environment') {
             setError('Google Sign-In is not supported in this environment. Please use email and password.');
        } else {
             setError(error.message || "Failed to sign in with Google.");
        }
      }
    });
  }, [router]);


  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
  } = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) });

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSignUp = (values: SignUpFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await signUpWithEmail(values);
      if (result.error) {
        setError(result.error);
      } else {
        toast({ title: 'Success', description: 'Account created! Welcome.' });
        router.push('/');
      }
    });
  };

  const onLogin = (values: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await loginWithEmail(values);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/');
      }
    });
  };

  const onGoogleLogin = () => {
    setError(null);
    startTransition(async () => {
      const result = await loginWithGoogle();
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <ThemeProvider forcedTheme="dark">
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription>
                    Log in or create an account to get started.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="login">
                            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <Input id="login-email" type="email" placeholder="m@example.com" {...registerLogin('email')} />
                                    {loginErrors.email && <p className="text-red-500 text-xs">{loginErrors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input id="login-password" type="password" {...registerLogin('password')} />
                                    {loginErrors.password && <p className="text-red-500 text-xs">{loginErrors.password.message}</p>}
                                </div>
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Login
                                </Button>
                            </form>
                        </TabsContent>
                        
                        <TabsContent value="signup">
                            <form onSubmit={handleSignUpSubmit(onSignUp)} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">Display Name</Label>
                                    <Input id="signup-name" type="text" placeholder="John Doe" {...registerSignUp('displayName')} />
                                    {signUpErrors.displayName && <p className="text-red-500 text-xs">{signUpErrors.displayName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input id="signup-email" type="email" placeholder="m@example.com" {...registerSignUp('email')} />
                                    {signUpErrors.email && <p className="text-red-500 text-xs">{signUpErrors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input id="signup-password" type="password" {...registerSignUp('password')} />
                                    {signUpErrors.password && <p className="text-red-500 text-xs">{signUpErrors.password.message}</p>}
                                </div>
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Account
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                    
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                            Or continue with
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={onGoogleLogin} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 264.1 0 128.5 106.6 13.3 244 13.3c69.1 0 125.3 24.3 172.4 68.6l-65.7 64.2C314.5 118.9 282.8 103 244 103c-84.3 0-152.3 65.5-152.3 161.1s68 161.1 152.3 161.1c91.1 0 134-60.8 138.8-93.2H244v-75.9h239.9c4.7 26.8 7.1 55.8 7.1 86.9z"></path>
                            </svg>
                        )}
                        Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    </ThemeProvider>
  );
}
