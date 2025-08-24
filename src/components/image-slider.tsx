
'use client';

import * as React from 'react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface SliderImage {
  src: string;
  alt: string;
  hint: string;
}

const images: SliderImage[] = [
  {
    src: 'https://placehold.co/1280x720.png',
    alt: 'Award ceremony',
    hint: 'award ceremony',
  },
  {
    src: 'https://placehold.co/1280x720.png',
    alt: 'Team working together',
    hint: 'teamwork collaboration',
  },
  {
    src: 'https://placehold.co/1280x720.png',
    alt: 'Electronics project',
    hint: 'electronics hardware',
  },
  {
    src: 'https://placehold.co/1280x720.png',
    alt: 'Startup discussion',
    hint: 'startup meeting',
  },
];

export function ImageSlider() {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-4xl mx-auto mt-8"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={image.hint}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
