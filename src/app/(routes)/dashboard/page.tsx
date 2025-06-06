"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Status } from "@/components/ui/status";
import { checkUserRole } from "@/actions/check-role";
import { Loader2, AlertCircle, Clock, XCircle } from "lucide-react";

const Dashboard = () => {
  const router = useRouter();
  const session = authClient.useSession();
  const [error, setError] = useState<
    | false
    | "admin-deleted"
    | "admin-inactive"
    | "student-deleted"
    | "student-pending"
    | "student-rejected"
    | "verification-failed"
  >(false);

  useEffect(() => {
    const checkRole = async () => {
      if (session.data?.user) {
        try {
          const { role, needsOnboarding, status } = await checkUserRole(
            session.data.user.id
          );

          if (needsOnboarding) {
            router.push("/onboarding");
            return;
          }

          if (role === "admin") {
            if (status === "deleted") {
              setError("admin-deleted");
              return;
            }
            if (status === "inactive") {
              setError("admin-inactive");
              return;
            }
            router.push("/dashboard/admin");
          } else {
            if (status === "deleted") {
              setError("student-deleted");
              return;
            }
            if (status === "pending") {
              setError("student-pending");
              return;
            }
            if (status === "rejected") {
              setError("student-rejected");
              return;
            }
            router.push("/dashboard/student");
          }
        } catch (error) {
          console.error("Failed to check user role:", error);
          setError("verification-failed");
        }
      }
    };

    if (!session.isPending && session.data?.user) {
      checkRole();
    }
  }, [session, router]);

  if (error === "admin-deleted") {
    return (
      <Status
        icon={AlertCircle}
        title="Account Deleted"
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        description="Your admin account has been deleted. Please contact the system administrator for assistance."
        button={{
          href: "/",
          variant: "default",
          label: "Go to Home",
        }}
      />
    );
  }

  if (error === "admin-inactive") {
    return (
      <Status
        icon={AlertCircle}
        title="Account Inactive"
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        description="Your admin account is currently inactive. Please contact the system administrator to reactivate your account."
        button={{
          href: "/",
          variant: "default",
          label: "Go to Home",
        }}
      />
    );
  }

  if (error === "student-deleted") {
    return (
      <Status
        icon={AlertCircle}
        title="Account Deleted"
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        description="Your student account has been deleted. Please contact the administrator for assistance."
        button={{
          href: "/",
          variant: "default",
          label: "Go to Home",
        }}
      />
    );
  }

  if (error === "student-pending") {
    return (
      <Status
        icon={Clock}
        iconBg="bg-yellow-500/10"
        iconColor="text-yellow-500"
        title="Account Pending Approval"
        description="Your account is pending approval from the administrator. You will be notified once it is approved."
        button={{
          href: "/",
          variant: "default",
          label: "Go to Home",
        }}
      />
    );
  }

  if (error === "student-rejected") {
    return (
      <Status
        icon={XCircle}
        title="Account Rejected"
        iconBg="bg-destructive/10"
        iconColor="text-destructive"
        description="Your account registration has been rejected. Please contact the administrator for more information."
        button={{
          href: "/",
          variant: "default",
          label: "Go to Home",
        }}
      />
    );
  }

  if (error === "verification-failed") {
    return (
      <Status
        icon={AlertCircle}
        iconBg="bg-destructive/10"
        title="Verification Failed"
        iconColor="text-destructive"
        description="We couldn't verify your role. Please try again or contact support if the problem persists."
        button={{
          href: "/",
          variant: "default",
          label: "Go to Home",
        }}
      />
    );
  }

  return (
    <Status
      icon={Loader2}
      iconBg="bg-muted"
      iconClassName="animate-spin"
      iconColor="text-foreground"
      title="Setting Up Your Dashboard"
      description="Please wait while we verify your account..."
    />
  );
};

export default Dashboard;
