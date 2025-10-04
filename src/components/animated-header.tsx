'use client';

import { useState, useEffect } from 'react';

interface AnimatedHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function AnimatedHeader({ title, description, children }: AnimatedHeaderProps) {
  const [gradient, setGradient] = useState({ from: '#000', to: '#000' });

  useEffect(() => {
    // Generate two random HSL colors for the gradient
    // This runs only on the client to avoid hydration mismatch
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + Math.floor(Math.random() * 60) + 60) % 360;
    const fromColor = `hsl(${hue1}, 80%, 60%)`;
    const toColor = `hsl(${hue2}, 80%, 60%)`;
    setGradient({ from: fromColor, to: toColor });
  }, []);

  return (
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <h1
          className="text-3xl md:text-4xl font-bold animate-fade-in-up animated-gradient-underline"
          style={{ '--gradient-from': gradient.from, '--gradient-to': gradient.to } as React.CSSProperties}
        >
          {title}
        </h1>
        {children}
      </div>
      <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {description}
      </p>
    </div>
  );
}
