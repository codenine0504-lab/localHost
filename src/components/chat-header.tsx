
'use client';

import { ChevronLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  projectTitle: string;
  onHeaderClick: () => void;
  isDm?: boolean;
}

export function ChatHeader({ projectTitle, onHeaderClick, isDm = false }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div
          className={`flex items-center gap-2 ${!isDm ? 'cursor-pointer group' : ''}`}
          onClick={onHeaderClick}
        >
          <h1 className={`text-lg font-semibold truncate ${!isDm ? 'group-hover:text-primary transition-colors' : ''}`}>
            {projectTitle}
          </h1>
          {!isDm && <Info className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
        </div>
      </div>
    </header>
  );
}
