"use client";

import {
  User,
  Info,
  MapPin,
  XCircle,
  FileText,
  ExternalLink,
  AlertTriangle,
  GraduationCap,
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
import { toast } from "sonner";
import { format } from "date-fns";
import Status from "@/components/ui/status";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getUserInitials } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getStudentProfile, StudentProfile } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProfilePage = () => {
  const session = authClient.useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<StudentProfile | null>(null);

  const loadProfile = async () => {
    if (session.data?.user) {
      try {
        setIsLoading(true);

        const result = await getStudentProfile(session.data.user.id);

        if (result.isSuccess) {
          setProfileData(result.data);
        } else {
          return (
            <Status
              icon={XCircle}
              iconColor="text-white"
              iconBg="bg-destructive"
              title="Error Loading Profile"
              containerClassName="min-h-[88vh]"
              description="We couldn't fetch your profile details. Please try again shortly."
            />
          );
        }
      } catch (error) {
        toast.error("Failed to load student profile");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (session.data?.user) {
      loadProfile();
    }
  }, [session.data?.user?.id]);

  if (isLoading || session.isPending) {
    return (
      <div className="container max-w-5xl mx-auto space-y-6 py-12 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="size-10 rounded-md" />
        </div>

        <Skeleton className="h-px w-full" />

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <Status
        icon={AlertTriangle}
        iconBg="bg-amber-500"
        iconColor="text-white"
        title="Student Profile Missing"
        containerClassName="min-h-[88vh]"
        description="We couldn't find your student profile. Please contact support or try signing in again."
      />
    );
  }

  return (
    <div className="container max-w-5xl mx-auto space-y-6 py-12 px-4">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-3">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage
              alt={session.data?.user.name || "Student"}
              src={session.data?.user.image || undefined}
            />
            <AvatarFallback className="rounded-lg">
              {getUserInitials("Student", session.data?.user.name)}
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
                {profileData.createdAt &&
                  format(
                    new Date(profileData.createdAt),
                    "MMM dd, yyyy 'at' h:mm a"
                  )}
              </li>
              <li>
                Last Edit:{" "}
                {profileData.updatedAt &&
                  format(
                    new Date(profileData.updatedAt),
                    "MMM dd, yyyy 'at' h:mm a"
                  )}
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <User className="size-5" />
            </div>

            <div className="flex-1">
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Full Name
              </p>
              <p className="font-medium">
                {[
                  profileData.firstName,
                  profileData.middleName,
                  profileData.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Date of Birth
              </p>
              <p className="font-medium">
                {profileData.dateOfBirth &&
                  format(new Date(profileData.dateOfBirth), "MMMM dd, yyyy")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Gender
              </p>
              <Badge variant="secondary">{profileData.gender || "N/A"}</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="font-medium">{profileData.address || "N/A"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Academic Information</CardTitle>
              <CardDescription>Your academic details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Year</p>
              <Badge variant="outline">
                {profileData.class?.year?.name ?? "N/A"} (
                {profileData.class?.year?.code ?? "N/A"})
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Branch
              </p>
              <p className="font-medium">
                {profileData.class?.branch?.name ?? "N/A"} (
                {profileData.class?.branch?.code ?? "N/A"})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <Badge variant="outline">
                {profileData.class?.code || "N/A"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <MapPin className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Travel Information</CardTitle>
              <CardDescription>Your travel preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Home Station
              </p>
              <p className="font-medium">
                {profileData.station?.name || "N/A"} (
                {profileData.station?.code || "N/A"})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Preferred Concession Class
              </p>
              <Badge variant="outline">
                {profileData.preferredConcessionClass?.name || "N/A"} (
                {profileData.preferredConcessionClass?.code || "N/A"})
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Preferred Concession Period
            </p>
            <Badge variant="outline">
              {profileData.preferredConcessionPeriod?.name || "N/A"} (
              {profileData.preferredConcessionPeriod?.duration != null
                ? `${profileData.preferredConcessionPeriod.duration} ${
                    profileData.preferredConcessionPeriod.duration === 1
                      ? "month"
                      : "months"
                  }`
                : "N/A"}
              )
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Document Verification</CardTitle>
              <CardDescription>Your uploaded document</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm font-medium">Verification Document</p>
              <p className="text-xs text-muted-foreground">
                {profileData.verificationDocUrl
                  ? "Click to view your uploaded document"
                  : "No document uploaded"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
              disabled={!profileData.verificationDocUrl}
              asChild={!!profileData.verificationDocUrl}
            >
              {profileData.verificationDocUrl ? (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={profileData.verificationDocUrl}
                >
                  <ExternalLink className="size-4" />
                  View Document
                </a>
              ) : (
                <span>
                  <FileText className="size-4" />
                  No Document
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
