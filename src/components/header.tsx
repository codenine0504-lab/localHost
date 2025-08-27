
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { InstallPwaButton } from './install-pwa-button';


interface HeaderProps {
  onTitleClick?: () => void;
}

export function Header({ onTitleClick }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [chatRoomName, setChatRoomName] = useState<string | null>(null);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const isChatPage = pathname.startsWith('/chatroom/');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchChatRoomName = async () => {
      if (isChatPage && params.id) {
        const chatRoomId = params.id as string;
        const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatRoomId));
        if (chatRoomDoc.exists()) {
          setChatRoomName(chatRoomDoc.data().name);
        } else {
          setChatRoomName("Chat");
        }
      } else {
        setChatRoomName(null);
      }
    };
    fetchChatRoomName();
  }, [pathname, params, isChatPage]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;
      
      const userDocRef = doc(db, "users", loggedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            uid: loggedInUser.uid,
            email: loggedInUser.email,
            displayName: loggedInUser.displayName,
            photoURL: loggedInUser.photoURL,
        }, { merge: true });
      }

    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
  };

  const TitleComponent = onTitleClick ? 'button' : 'span';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
           {isChatPage ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
               <TitleComponent onClick={onTitleClick} className="font-bold text-lg cursor-pointer">
                {chatRoomName || 'Chat'}
              </TitleComponent>
            </>
          ) : (
            <Link href="/" className="flex items-center gap-2 mr-6">
              <span className="font-bold text-lg text-primary" style={{color: 'green'}}>LocalHost</span>
            </Link>
          )}
        </div>

        {!isChatPage && (
            <nav className="hidden md:flex flex-grow items-center gap-6">
                 <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/" ? "text-primary" : "text-muted-foreground")}>Home</Link>
                 <Link href="/projects" className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/projects" ? "text-primary" : "text-muted-foreground")}>Explore</Link>
                 <Link href="/chatroom" className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/chatroom" ? "text-primary" : "text-muted-foreground")}>Chats</Link>
            </nav>
        )}

        <div className="flex items-center gap-4">
          <InstallPwaButton />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage src={user.photoURL!} alt={user.displayName!} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                 <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleGoogleLogin} variant="outline" size="sm" className="ml-auto">
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
