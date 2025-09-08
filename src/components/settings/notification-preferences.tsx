"use client";

import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { updateNotificationPreferences } from "@/actions/settings";

const NotificationPreferences = () => {
  const { data, isPending } = authClient.useSession();

  const [loading, setLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState<boolean>(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState<boolean>(true);

  useEffect(() => {
    if (!isPending && data?.user) {
      setPushNotificationsEnabled(data.user.pushNotificationsEnabled ?? true);
      setEmailNotificationsEnabled(data.user.emailNotificationsEnabled ?? true);
      setLoading(false);
    } else if (!isPending) {
      setLoading(false);
    }
  }, [data?.user, isPending]);

  const handleToggle = async (type: "push" | "email", enabled: boolean) => {
    if (!data?.user?.id || isUpdating) return;

    setIsUpdating(true);

    const preferences =
      type === "push" ? { pushEnabled: enabled } : { emailEnabled: enabled };

    const updatePromise = updateNotificationPreferences(
      data.user.id,
      preferences
    );

    toast.promise(updatePromise, {
      loading: `Updating ${type} notification preferences...`,
      success: `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } notification preferences updated successfully!`,
      error: (error) =>
        error.error || `Failed to update ${type} notification preferences`,
    });

    try {
      const result = await updatePromise;

      if (result.isSuccess) {
        if (type === "push") {
          setPushNotificationsEnabled(enabled);
        } else {
          setEmailNotificationsEnabled(enabled);
        }
      }
    } catch (error) {
      console.error(`${type} notification preference update error:`, error);
      toast.error("Update Failed", {
        description: `Unable to update your ${type} notification preferences. Please try again.`,
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="push-notifications-toggle"
                    className="text-sm font-medium"
                  >
                    Push Notifications
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground">
                  Receive push notifications about concession status updates and
                  important announcements
                </p>
              </div>
              <Switch
                disabled={isUpdating}
                id="push-notifications-toggle"
                checked={pushNotificationsEnabled}
                onCheckedChange={(enabled) => handleToggle("push", enabled)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="email-notifications-toggle"
                    className="text-sm font-medium"
                  >
                    Email Notifications
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground">
                  Receive email notifications about concession status updates
                  and important announcements
                </p>
              </div>

              <Switch
                disabled={isUpdating}
                id="email-notifications-toggle"
                checked={emailNotificationsEnabled}
                onCheckedChange={(enabled) => handleToggle("email", enabled)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
