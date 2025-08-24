'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const images = [
  {
    src: '/award.jpg',
    alt: 'Collaboration in an office',
    hint: 'collaboration office',
  },
  {
    src: '/teamwork.jpg',
    alt: 'Team brainstorming with sticky notes',
    hint: 'team brainstorming',
  },
  {
    src: '/electronics.png',
    alt: 'Innovative technology design',
    hint: 'innovation technology',
  },
  {
    src: '/startup.png',
    alt: 'Connecting people globally',
    hint: 'connecting people',
  },
];

export function ImageSlider() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) {
      return;
    }

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="overflow-hidden shadow-lg rounded-xl">
                  <CardContent className="flex aspect-video items-center justify-center p-0">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={1200}
                      height={600}
                      className="object-cover w-full h-full"
                      data-ai-hint={image.hint}
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
      </Carousel>
    </div>
  );
}
