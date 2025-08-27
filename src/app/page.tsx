"use client";

import { useState, useEffect, useMemo } from "react";
import type { Port, PortStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PortCard from "@/components/port-card";
import PortDetailsDialog from "@/components/port-details-dialog";
import { Server, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data generation
const generateMockPorts = (count: number): Port[] => {
  const ports: Port[] = [];
  const statuses: PortStatus[] = ['Available', 'In Use', 'Listening'];
  const processes = ['nginx', 'node', 'postgres', 'docker', 'system', 'chrome', 'vscode', 'db-agent'];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const inUse = status !== 'Available';
    ports.push({
      id: 3000 + i,
      status: status,
      protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
      process: inUse ? processes[Math.floor(Math.random() * processes.length)] : null,
      cpu: inUse ? `${(Math.random() * 5).toFixed(2)}%` : null,
      memory: inUse ? `${(Math.random() * 512).toFixed(2)} MB` : null,
    });
  }
  return ports;
};

export default function Home() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PortStatus | "all">("all");
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const initialPorts = generateMockPorts(100);
    setPorts(initialPorts);

    const interval = setInterval(() => {
      setPorts(prevPorts => {
        if (prevPorts.length === 0) return [];
        const newPorts = [...prevPorts];
        const randomIndex = Math.floor(Math.random() * newPorts.length);
        const portToUpdate = newPorts[randomIndex];
        
        const oldStatus = portToUpdate.status;
        let newStatus: PortStatus;
        if (oldStatus === 'Available') {
          newStatus = Math.random() > 0.5 ? 'In Use' : 'Listening';
        } else {
          newStatus = 'Available';
        }
        
        const inUse = newStatus !== 'Available';
        const processes = ['nginx', 'node', 'postgres', 'docker', 'system', 'chrome', 'vscode', 'db-agent'];

        newPorts[randomIndex] = {
          ...portToUpdate,
          status: newStatus,
          process: inUse ? processes[Math.floor(Math.random() * processes.length)] : null,
          cpu: inUse ? `${(Math.random() * 5).toFixed(2)}%` : null,
          memory: inUse ? `${(Math.random() * 512).toFixed(2)} MB` : null,
        };

        return newPorts;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredPorts = useMemo(() => {
    return ports.filter(port => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = port.id.toString().includes(searchTermLower) || port.process?.toLowerCase().includes(searchTermLower);
      const matchesStatus = statusFilter === "all" || port.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ports, searchTerm, statusFilter]);
  
  const PageSkeleton = () => (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">LocalHost</h1>
          </div>
        </div>
      </header>
       <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-8 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  );

  if (!isMounted) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-headline">LocalHost</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-8 space-y-4">
            <h2 className="text-3xl font-headline font-bold tracking-tight">Port Dashboard</h2>
            <p className="text-muted-foreground">Monitor, search, and manage your local network ports in real-time.</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by port or process..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search ports"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: PortStatus | "all") => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="In Use">In Use</SelectItem>
              <SelectItem value="Listening">Listening</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredPorts.map(port => (
            <PortCard key={port.id} port={port} onSelect={() => setSelectedPort(port)} />
          ))}
        </div>
        
        {ports.length > 0 && filteredPorts.length === 0 && (
          <div className="text-center py-24 text-muted-foreground bg-card rounded-lg">
            <p className="text-lg font-medium">No ports found</p>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </main>
      
      <PortDetailsDialog
        port={selectedPort}
        isOpen={selectedPort !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedPort(null);
          }
        }}
      />
    </div>
  );
}
