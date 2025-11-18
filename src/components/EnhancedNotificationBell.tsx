"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bell, Eye, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EnhancedNotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showClearDialog, setShowClearDialog] = useState<boolean>(false);

  const notifications = useQuery(
    api.notifications.list,
    user ? { userId: user.userId } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.unreadCount,
    user ? { userId: user.userId } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteAll = useMutation(api.notifications.deleteAll);

  if (!user) return null;

  const handleNotificationClick = async (notificationId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await markAsRead({ id: notificationId as any });
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      await markAllAsRead({ userId: user.userId });
      toast.success("All notifications marked as read");
    }
  };

  const handleClearAll = async () => {
    if (user) {
      await deleteAll({ userId: user.userId });
      setShowClearDialog(false);
      setIsOpen(false);
      toast.success("All notifications cleared");
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push(
      user.role === "admin" ? "/admin/notifications" : "/member/notifications"
    );
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount !== undefined && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-8"
                  title="Mark all as read"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Mark all
                </Button>
              )}
              {notifications && notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                  className="text-xs h-8 text-red-600 hover:text-red-700"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            {notifications && notifications.length > 0 ? (
              <>
                <div className="divide-y">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read
                          ? "bg-blue-50 dark:bg-blue-950/20"
                          : ""
                      }`}
                      onClick={() => handleNotificationClick(notification._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.read ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(notification.createdAt, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {notifications.length > 5 && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      className="w-full"
                      size="sm"
                      onClick={handleViewAll}
                    >
                      View All Notifications ({notifications.length})
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-30" />
                <p>No notifications</p>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your notifications. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
