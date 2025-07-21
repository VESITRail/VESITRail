"use client";

import {
  User,
  Info,
  Users,
  MapPin,
  XCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import Status from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCallback, useEffect, useState } from "react";
import { getUserInitials, toTitleCase } from "@/lib/utils";
import { getAdminProfile, AdminProfile } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminProfilePage = () => {
  const session = authClient.useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<AdminProfile | null>(null);

  const loadProfile = useCallback(async () => {
    if (session.data?.user) {
      try {
        setIsLoading(true);

        const result = await getAdminProfile(session.data.user.id);

        if (result.isSuccess) {
          setProfileData(result.data);
        } else {
          toast.error("Profile Load Failed", {
            description: "Unable to load your profile. Please try again.",
          });
        }
      } catch (error) {
        console.error("Error while loading user profile:", error);
        toast.error("Loading Error", {
          description: "Something went wrong while loading your profile.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [session.data?.user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading || session.isPending) {
    return (
      <div className="container max-w-5xl mx-auto space-y-6 py-12 px-4">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-8 w-48" />
          </span>
          <Skeleton className="size-10 rounded-md" />
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-lg" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-lg" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-lg" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-14" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <Status
        icon={AlertTriangle}
        iconBg="bg-amber-500"
        iconColor="text-white"
        title="Admin Profile Missing"
        containerClassName="min-h-[88vh]"
        description="We couldn't find your admin profile. Please contact support or try signing in again."
      />
    );
  }

  return (
    <div className="container max-w-5xl mx-auto space-y-6 py-12 px-4">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-3">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage
              src={profileData?.user.image || undefined}
              alt={toTitleCase(profileData?.user.name) || "Admin"}
            />
            <AvatarFallback className="rounded-lg">
              {getUserInitials("Admin", profileData.user.name)}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-2xl font-semibold">Profile Overview</h1>
        </span>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="outline" className="size-10">
              <Info className="size-5" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            side="bottom"
            className="text-sm bg-background"
          >
            <p className="font-medium mb-4">Profile Information</p>

            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                Created:{" "}
                {format(
                  new Date(profileData.createdAt),
                  "MMM dd, yyyy 'at' h:mm a"
                )}
              </li>
              <li>
                Last Edit:{" "}
                {format(
                  new Date(profileData.updatedAt),
                  "MMM dd, yyyy 'at' h:mm a"
                )}
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="size-11 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="size-5.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Students Reviewed
                </p>
                <p className="text-xl font-bold text-foreground">
                  {profileData.studentsCount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="size-11 bg-primary/20 rounded-lg flex items-center justify-center">
                <MapPin className="size-5.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Address Changes
                </p>
                <p className="text-xl font-bold text-foreground">
                  {profileData.addressChangesCount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="size-11 bg-primary/20 rounded-lg flex items-center justify-center">
                <FileText className="size-5.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Applications Reviewed
                </p>
                <p className="text-xl font-bold text-foreground">
                  {profileData.applicationsCount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <User className="size-5" />
              </div>

              <div className="flex-1">
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </div>
            </div>

            <Badge
              variant={
                profileData.user.emailVerified ? "default" : "destructive"
              }
            >
              {profileData.user.emailVerified ? (
                <>
                  <CheckCircle className="size-4 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <XCircle className="size-4 mr-1" />
                  Not Verified
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">
                {toTitleCase(profileData.user.name) || "Admin"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{profileData.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfilePage;
