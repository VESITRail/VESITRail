"use client";

import {
  Mail,
  Clock,
  Loader2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Status } from "@/components/ui/status";
import { getLastApplication } from "@/actions/concession";
import { calculateConcessionValidity } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConcessionApplication {
  concessionPeriod: {
    name: string;
    duration: number;
  };
  id: string;
  approvedAt: Date | null;
  status: "Pending" | "Approved" | "Rejected";
}

const ApplyConcession = () => {
  const { data, isPending } = authClient.useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [canApply, setCanApply] = useState<boolean>(false);

  const [lastApplication, setLastApplication] =
    useState<ConcessionApplication | null>(null);

  const [status, setStatus] = useState<{
    title: string;
    iconBg: string;
    icon: LucideIcon;
    iconColor: string;
    description: string;
    iconClassName?: string;
    button?: {
      href: string;
      label: string;
      icon: LucideIcon;
      variant?: "default" | "outline" | "ghost";
    };
  } | null>(null);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (isPending || !data?.user?.id) {
        return;
      }

      setLoading(true);

      try {
        const result = await getLastApplication(data.user.id);

        if (!result.success) {
          setCanApply(false);

          setStatus({
            icon: XCircle,
            iconColor: "text-white",
            iconBg: "bg-destructive",
            title: "Error Loading Application",
            description:
              "Unable to fetch your application status. Please try again later or contact support if the issue persists.",
            button: {
              icon: Mail,
              label: "Contact",
              href: "/#contact",
              variant: "default",
            },
          });

          return;
        }

        const application = result.data;
        setLastApplication(application);

        if (!application) {
          setStatus(null);
          setCanApply(true);
        } else {
          switch (application.status) {
            case "Rejected":
              setStatus(null);
              setCanApply(true);
              break;

            case "Pending":
              setCanApply(false);

              setStatus({
                icon: Clock,
                iconBg: "bg-yellow-600",
                iconColor: "text-white",
                title: "Application Under Review",
                description:
                  "Your concession application is currently being reviewed. Please wait for approval before applying again.",
              });

              break;

            case "Approved":
              if (application.approvedAt) {
                const validity = calculateConcessionValidity(
                  new Date(application.approvedAt),
                  application.concessionPeriod.duration
                );

                if (validity.isValid) {
                  setCanApply(false);

                  setStatus({
                    icon: CheckCircle,
                    iconBg: "bg-green-600",
                    iconColor: "text-white",
                    title: "Active Concession",
                    description: `Your concession is currently active and valid until ${format(
                      new Date(validity.expiryDate),
                      "MMMM dd, yyyy"
                    )}. You have ${validity.daysRemaining} day${
                      validity.daysRemaining !== 1 ? "s" : ""
                    } remaining.`,
                  });
                } else {
                  setStatus(null);
                  setCanApply(true);
                }
              } else {
                setStatus(null);
                setCanApply(true);
              }

              break;

            default:
              setStatus(null);
              setCanApply(true);
          }
        }
      } catch (error) {
        setCanApply(false);
        setStatus({
          icon: XCircle,
          iconColor: "text-white",
          iconBg: "bg-destructive",
          title: "Error Loading Application",
          description:
            "An unexpected error occurred while checking your application status. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    checkApplicationStatus();
  }, [data?.user?.id, isPending]);

  if (isPending || loading) {
    return (
      <Status
        icon={Loader2}
        iconBg="bg-muted"
        iconColor="text-foreground"
        iconClassName="animate-spin"
        containerClassName="min-h-[88vh]"
        title="Loading Application Status"
        description="Checking your previous application status. Please wait..."
      />
    );
  }

  if (!canApply && status) {
    return (
      <Status
        icon={status.icon}
        title={status.title}
        iconBg={status.iconBg}
        button={status.button}
        iconColor={status.iconColor}
        description={status.description}
        containerClassName="min-h-[88vh]"
        iconClassName={status.iconClassName}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-foreground">
          Apply for Concession
        </h1>

        {lastApplication?.status === "Rejected" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Previous Application Rejected</AlertTitle>
            <AlertDescription>
              You can submit a new application.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 mt-4">
          <div className="p-6 border border-border rounded-lg bg-card">
            <p className="text-muted-foreground">
              Your concession application form will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyConcession;
