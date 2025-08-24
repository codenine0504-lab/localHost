
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

import awardImg from '../../../public/slider/award.jpg';
import teamworkImg from '../../../public/slider/teamwork.jpg';
import electronicsImg from '../../../public/slider/electronics.png';
import startupImg from '../../../public/slider/startup.png';
import meetingImg from '../../../public/slider/meeting.jpg';

const sliderImages = [
    { id: '1', title: 'Award', imageUrl: awardImg },
    { id: '2', title: 'Teamwork', imageUrl: teamworkImg },
    { id: '3', title: 'Electronics', imageUrl: electronicsImg },
    { id: '4', title: 'Startup', imageUrl: startupImg },
    { id: '5', title: 'Meeting', imageUrl: meetingImg },
]

export function ImageSlider() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) {
      return;
    }

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

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
          {sliderImages.map((image) => (
            <CarouselItem key={image.id}>
              <div className="p-1">
                <Card className="overflow-hidden shadow-lg rounded-xl">
                  <CardContent className="flex aspect-video items-center justify-center p-0">
                    <Image
                      src={image.imageUrl}
                      alt={image.title}
                      width={1200}
                      height={600}
                      className="object-cover w-full h-full"
                      data-ai-hint="showcase image"
                      placeholder="blur"
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
