"use client";

import {
  User,
  Mail,
  Info,
  MapPin,
  Loader2,
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
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getUserInitials } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudentProfile, StudentProfileResponse } from "@/actions/profile";

const ProfilePage = () => {
  const session = authClient.useSession();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<
    StudentProfileResponse["data"] | null
  >(null);

  const loadProfile = async () => {
    if (!session.data?.user?.id) {
      setError("User not authenticated");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const result = await getStudentProfile(session.data.user.id);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setProfileData(result.data);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load profile";

      setError(errorMessage);

      toast.error("Loading Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session.data?.user?.id) {
      loadProfile();
    }
  }, [session.data?.user?.id]);

  if (isLoading || session.isPending) {
    return (
      <div className="container max-w-5xl mx-auto">
        <Status
          icon={Loader2}
          iconBg="bg-muted"
          title="Loading Information"
          iconColor="text-foreground"
          iconClassName="animate-spin"
          containerClassName="min-h-[88vh]"
          description="We're preparing your information. This will only take a moment."
        />
      </div>
    );
  }

  if (error) {
    return (
      <Status
        icon={AlertTriangle}
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        title="Error Loading Profile"
        containerClassName="min-h-[88vh]"
        description={
          error ||
          "We couldn’t fetch your profile details. Please try again shortly."
        }
        button={{
          icon: Mail,
          label: "Contact",
          href: "/#contact",
          variant: "default",
        }}
      />
    );
  }

  if (!profileData) {
    return (
      <Status
        icon={User}
        iconBg="bg-muted"
        title="Profile Not Found"
        iconColor="text-foreground"
        containerClassName="min-h-[88vh]"
        description="Your profile information is not available."
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
                {profileData.firstName} {profileData.middleName}{" "}
                {profileData.lastName}
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
              <Badge variant="secondary">{profileData.gender}</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="font-medium">{profileData.address}</p>
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
              <Badge variant="outline">{profileData.class?.year?.name}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Branch
              </p>
              <p className="font-medium">{profileData.class?.branch?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <Badge variant="outline">{profileData.class?.code}</Badge>
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
              <p className="font-medium">{profileData.station?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Preferred Concession Class
              </p>
              <Badge variant="outline">
                {profileData.preferredConcessionClass?.name}
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Preferred Concession Period
            </p>
            <Badge variant="outline">
              {profileData.preferredConcessionPeriod?.name}
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
                Click to view your uploaded document
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={profileData.verificationDocUrl || "#"}
              >
                <ExternalLink className="w-4 h-4" />
                View Document
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
