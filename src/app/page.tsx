"use client";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary font-headline">LocalHost</h1>
          </div>
        </div>
      </header>
    </div>
  );
}
