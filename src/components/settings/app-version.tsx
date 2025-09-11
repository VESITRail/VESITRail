"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { serviceWorkerManager, versionManager } from "@/lib/pwa";

type AppVersionProps = {
  initialVersion?: string | null;
};

export const AppVersion = ({ initialVersion }: AppVersionProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [version, setVersion] = useState<string | null>(initialVersion || null);

  const formatLastChecked = (date: Date): string => {
    return format(date, "MMMM d, yyyy HH:mm");
  };

  const checkForUpdates = async (): Promise<void> => {
    setUpdating(true);
    try {
      await serviceWorkerManager.update();
      const newVersion = await versionManager.getVersionString();

      setVersion(newVersion);
      setLastChecked(new Date());

      toast.success("Check Complete", {
        duration: 2000,
        description: "You're running the latest version.",
      });
    } catch (error) {
      console.error("Failed to check for updates:", error);
      toast.error("Update Check Failed", {
        description: "Unable to check for updates. Please try again.",
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const loadVersion = async (): Promise<void> => {
      setLoading(true);
      try {
        const currentVersion = await versionManager.getVersionString();
        setVersion(currentVersion);
      } catch (error) {
        console.error("Failed to load version:", error);
        setVersion("Unknown");
      } finally {
        setLoading(false);
      }
    };

    if (!initialVersion) {
      loadVersion();
    } else {
      setLoading(false);
    }
  }, [initialVersion]);

  if (loading) {
    return (
      <div id="app-version" className="mb-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">App Version</h2>
          <p className="text-sm text-muted-foreground">
            Check for updates and manage application version information.
          </p>
        </div>

        <Card>
          <CardContent className="py-2.5">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-9 w-full sm:w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="app-version" className="mb-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">App Version</h2>
        <p className="text-sm text-muted-foreground">
          Check for updates and manage application version information.
        </p>
      </div>

      <Card>
        <CardContent className="py-2.5">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Current Version: {version || "Loading..."}
                </p>
                {lastChecked && (
                  <p className="text-xs text-muted-foreground">
                    Last checked: {formatLastChecked(lastChecked)}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                disabled={updating}
                onClick={checkForUpdates}
                className="w-full sm:w-auto"
              >
                {updating ? (
                  <>
                    <div className="size-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4 mr-1" />
                    Check Updates
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
