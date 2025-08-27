"use client";

import type { Port, PortStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PortDetailsDialogProps {
  port: Port | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const getBadgeVariant = (status: PortStatus): 'default' | 'destructive' | 'secondary' => {
    if (status === 'Available') return 'default';
    if (status === 'In Use') return 'destructive';
    return 'secondary';
};

export default function PortDetailsDialog({ port, isOpen, onOpenChange }: PortDetailsDialogProps) {
  if (!port) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <span className="font-bold text-2xl font-headline">Port {port.id}</span>
            <Badge variant={getBadgeVariant(port.status)} className={cn(port.status === 'Available' && 'bg-primary text-primary-foreground')}>
              {port.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed information and real-time usage for port {port.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <DetailRow label="Protocol" value={port.protocol} />
          <DetailRow label="Associated Process" value={port.process} />
          <DetailRow label="CPU Usage" value={port.cpu} />
          <DetailRow label="Memory Usage" value={port.memory} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string | null }) => (
  <div className="grid grid-cols-[140px_1fr] items-center gap-4 text-sm">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-medium text-right break-all">{value || "N/A"}</p>
  </div>
);
