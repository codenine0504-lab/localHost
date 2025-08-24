
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for projects - replace with Firestore data fetching
const mockProjects = [
  {
    id: '1',
    title: 'AI-Powered Plant Care App',
    description: 'An app that uses machine learning to identify plant diseases and provide care instructions.',
    tags: ['React Native', 'Firebase', 'Machine Learning'],
    college: 'NIT Raipur',
  },
  {
    id: '2',
    title: 'IoT Based Smart Home System',
    description: 'A system to control home appliances remotely using a web dashboard and mobile app.',
    tags: ['IoT', 'Raspberry Pi', 'Next.js'],
    college: 'IIT Bhilai',
  },
  {
    id: '3',
    title: 'Decentralized Social Media Platform',
    description: 'A social media platform built on blockchain technology to ensure user privacy and data ownership.',
    tags: ['Blockchain', 'Solidity', 'React'],
    college: 'GEC, Bilaspur',
  },
   {
    id: '4',
    title: 'E-commerce Website for Local Artisans',
    description: 'A platform for local artisans to sell their products online and reach a wider audience.',
    tags: ['Next.js', 'Stripe', 'PostgreSQL'],
    college: 'Shankarcharya Group',
  },
];


export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Here you would fetch data from Firestore
    // For now, we're using mock data
    setProjects(mockProjects);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">Explore Projects</h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl/relaxed">
          Find interesting projects to join and collaborate with talented individuals.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.college}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
