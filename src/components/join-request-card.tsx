
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, UserPlus, Loader2 } from "lucide-react";

interface JoinRequest {
    id: string;
    userId: string;
    userDisplayName: string | null;
    userPhotoURL: string | null;
}

interface JoinRequestCardProps {
    requests: JoinRequest[];
    onAction: (requestId: string, userId: string, action: 'approve' | 'decline') => void;
    processingId: string | null;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function JoinRequestCard({ requests, onAction, processingId }: JoinRequestCardProps) {
    if (requests.length === 0) {
        return null;
    }

    return (
        <div className="p-4 border-b">
            <Card className="max-w-4xl mx-auto bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        New Join Requests ({requests.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                        The following users want to join your project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {requests.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-2 rounded-md hover:bg-background/50">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={req.userPhotoURL || undefined} alt="User avatar" />
                                    <AvatarFallback>{getInitials(req.userDisplayName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{req.userDisplayName}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" className="h-8 w-8 border-green-500 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => onAction(req.id, req.userId, 'approve')} disabled={processingId === req.id}>
                                    {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button size="icon" variant="outline" className="h-8 w-8 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => onAction(req.id, req.userId, 'decline')} disabled={processingId === req.id}>
                                    {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
