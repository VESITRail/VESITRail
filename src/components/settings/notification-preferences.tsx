"use client";

import {
  getNotificationPreference,
  updateNotificationPreference,
} from "@/actions/settings";
import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const NotificationPreferences = () => {
  const { data, isPending } = authClient.useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(true);

  useEffect(() => {
    const fetchPreference = async () => {
      if (isPending || !data?.user?.id) return;

      setLoading(true);

      try {
        const result = await getNotificationPreference(data.user.id);

        if (result.isSuccess && result.data) {
          setNotificationsEnabled(result.data.enabled);
        } else {
          toast.error("Notification Settings Not Loading", {
            description:
              "Unable to load your notification preferences. Please try again.",
          });
        }
      } catch (error) {
        console.error("Notification preference load error:", error);
        toast.error("Settings Not Loading", {
          description:
            "Unable to load your notification settings. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreference();
  }, [data?.user?.id, isPending]);

  const handleToggle = async (enabled: boolean) => {
    if (!data?.user?.id || isUpdating) return;

    setIsUpdating(true);

    const updatePromise = updateNotificationPreference(data.user.id, enabled);

    toast.promise(updatePromise, {
      loading: "Updating notification preferences...",
      success: "Notification preferences updated successfully!",
      error: (error) =>
        error.error || "Failed to update notification preferences",
    });

    try {
      const result = await updatePromise;

      if (result.isSuccess) {
        setNotificationsEnabled(enabled);
      }
    } catch (error) {
      console.error("Notification preference update error:", error);
      toast.error("Update Failed", {
        description:
          "Unable to update your notification preferences. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="space-y-6 mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Notification Preferences
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your push notification settings and preferences.
          </p>
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Manage your push notification settings and preferences.
        </p>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="notifications-toggle"
                  className="text-sm font-medium"
                >
                  Push Notifications
                </Label>
                {isUpdating && (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Receive notifications about concession status updates and
                important announcements
              </p>
            </div>
            <Switch
              disabled={isUpdating}
              checked={notificationsEnabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
