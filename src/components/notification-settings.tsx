'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requestForToken } from '@/lib/firebase';
import { Bell, BellOff, BellRing } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showDeniedInfo, setShowDeniedInfo] = useState(false);

  const checkNotificationPermission = useCallback(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    checkNotificationPermission();
  }, [checkNotificationPermission]);

  const handleEnableNotifications = async () => {
    const token = await requestForToken();
    if (token) {
      setPermission('granted');
    } else {
      // If the user denied permission, the state will update to 'denied'
      checkNotificationPermission();
    }
  };

  const renderContent = () => {
    switch (permission) {
      case 'granted':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-green-600">
              <Bell className="h-5 w-5" />
              <p className="font-medium">Notifications are enabled.</p>
            </div>
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive">
                <BellOff className="h-5 w-5" />
                <p className="font-medium">Notifications are disabled.</p>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">How to enable</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>How to Enable Notifications</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                       <p>To receive notifications, you need to update your browser's site settings.</p>
                       <p>Click the padlock icon 🔒 in the address bar, find the "Notifications" permission, and change it to "Allow". You may need to reload the page afterward.</p>
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>Got it</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      case 'default':
      default:
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-muted-foreground">
                <BellRing className="h-5 w-5" />
                <p className="font-medium">Enable push notifications.</p>
            </div>
            <Button onClick={handleEnableNotifications}>Enable</Button>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage how you receive alerts and updates from the app.</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
