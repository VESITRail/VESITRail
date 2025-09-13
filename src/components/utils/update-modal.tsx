"use client";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerTitle,
  DrawerHeader,
  DrawerContent,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import ChangelogRenderer from "@/components/utils/changelog-renderer";

type UpdateInfo = {
  version: string;
  tagName: string;
  changelog: string;
  publishedAt: string;
};

type UpdateModalProps = {
  open: boolean;
  onIgnore: () => void;
  updateInfo: UpdateInfo;
  onUpdate: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
};

const UpdateModal = ({
  open,
  onUpdate,
  onIgnore,
  updateInfo,
  onOpenChange,
}: UpdateModalProps) => {
  const [updating, setUpdating] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [changelogExpanded, setChangelogExpanded] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await onUpdate();
      toast.success("Update Applied", {
        description: "The app is reloading with the latest version.",
      });
    } catch {
      toast.error("Update Failed", {
        description: "Failed to apply update. Please try again.",
      });
      setUpdating(false);
    }
  };

  const handleIgnore = () => {
    onIgnore();
    onOpenChange(false);
    toast.info("Update Ignored", {
      description: "You can check for updates anytime in settings.",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return "Unknown date";
    }
  };

  const formatChangelog = (changelog: string) => {
    const lines = changelog.split("\n").filter((line) => line.trim());
    const truncated = changelogExpanded ? lines : lines.slice(0, 3);
    const truncatedContent = truncated.join("\n");
    const fullContent = lines.join("\n");

    return {
      canExpand: lines.length > 3,
      isExpanded: changelogExpanded,
      content: changelogExpanded ? fullContent : truncatedContent,
    };
  };

  const { content, canExpand, isExpanded } = formatChangelog(
    updateInfo.changelog
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-lg font-semibold">
                  Update Available
                </DialogTitle>
                <Badge variant="secondary">v{updateInfo.version}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              Released on {formatDate(updateInfo.publishedAt)}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">What&apos;s New</h4>
                {canExpand && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => setChangelogExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="size-3 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3 mr-1" />
                        Show More
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto">
                <ChangelogRenderer
                  content={content}
                  className="space-y-1 text-sm text-muted-foreground"
                />
                {!isExpanded && canExpand && (
                  <p className="text-xs italic mt-2">...</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                disabled={updating}
                onClick={handleIgnore}
              >
                Ignore
              </Button>
              <Button
                disabled={updating}
                className="min-w-20"
                onClick={handleUpdate}
              >
                {updating ? (
                  <>
                    <div className="size-4 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-1" />
                    Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DrawerTitle className="text-lg font-semibold">
                Update Available
              </DrawerTitle>
              <Badge variant="secondary">v{updateInfo.version}</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            Released on {formatDate(updateInfo.publishedAt)}
          </p>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">What&apos;s New</h4>
              {canExpand && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setChangelogExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="size-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="max-h-32 overflow-y-auto">
              <ChangelogRenderer
                content={content}
                className="space-y-1 text-sm text-muted-foreground"
              />
              {!isExpanded && canExpand && (
                <p className="text-xs italic mt-2">...</p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              disabled={updating}
              onClick={handleIgnore}
            >
              Ignore
            </Button>

            <Button
              disabled={updating}
              onClick={handleUpdate}
              className="flex-1 h-9"
            >
              {updating ? (
                <>
                  <div className="size-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default UpdateModal;
