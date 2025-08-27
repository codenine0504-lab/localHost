"use client";

import type { Port, PortStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PortCardProps {
  port: Port;
  onSelect: () => void;
}

const StatusIndicator = ({ status }: { status: PortStatus }) => {
  const colorClass = status === 'Available' ? 'bg-primary' : status === 'In Use' ? 'bg-destructive' : 'bg-secondary';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("h-3 w-3 rounded-full animate-pulse", colorClass)} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
};

const getBadgeVariant = (status: Port['status']): 'default' | 'destructive' | 'secondary' => {
  if (status === 'Available') return 'default';
  if (status === 'In Use') return 'destructive';
  return 'secondary';
};

export default function PortCard({ port, onSelect }: PortCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out border-border/50 hover:border-primary/50"
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      tabIndex={0}
      role="button"
      aria-label={`View details for port ${port.id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold">{port.id}</CardTitle>
        <StatusIndicator status={port.status} />
      </CardHeader>
      <CardContent>
        <Badge variant={getBadgeVariant(port.status)} className={cn(port.status === 'Available' && 'bg-primary text-primary-foreground')}>
          {port.status}
        </Badge>
        <p className="text-xs text-muted-foreground mt-2 truncate h-4">{port.process || 'Idle'}</p>
      </CardContent>
    </Card>
  );
}
