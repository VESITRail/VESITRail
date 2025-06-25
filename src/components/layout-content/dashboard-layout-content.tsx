"use client";

import { toast } from "sonner";
import { isFailure } from "@/lib/result";
import Status from "@/components/ui/status";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { checkUserRole, UserRole } from "@/actions/check-role";
import { Loader2, UserX, Clock, XCircle, Mail } from "lucide-react";

const DashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const session = authClient.useSession();
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (session.isPending) return;

      if (!session.data?.user) {
        setIsVerifying(false);
        return;
      }

      try {
        const result = await checkUserRole(session.data.user.id);

        if (isFailure(result)) {
          console.error("Failed to check user role:", result.error);
          toast.error("Failed to verify account access. Please try again.");
          setIsVerifying(false);
          return;
        }

        const { role, status } = result.data;
        setUserRole({ role, status });

        if (role === "admin") {
          if (status === "Active") {
            router.push("/dashboard/admin");
            return;
          }
        } else if (role === "student") {
          if (status === "Approved") {
            router.push("/dashboard/student");
            return;
          } else if (status === "NeedsOnboarding") {
            router.push("/onboarding");
            return;
          }
        }

        setIsVerifying(false);
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error("Unexpected error while checking user role");
        setIsVerifying(false);
      }
    };

    checkAndRedirect();
  }, [router, session.isPending, session.data?.user]);

  if (isVerifying) {
    return (
      <Status
        icon={Loader2}
        iconBg="bg-muted"
        iconColor="text-foreground"
        iconClassName="animate-spin"
        title="Setting Up Your Dashboard"
        description="Please wait while we verify your account..."
      />
    );
  }

  if (userRole?.role === "admin" && userRole.status === "Inactive") {
    return (
      <Status
        icon={UserX}
        iconColor="text-white"
        iconBg="bg-destructive"
        title="Account Deactivated"
        description="Your admin account has been deactivated. Please contact the system administrator for assistance."
        button={{
          icon: Mail,
          href: "/#contact",
          label: "Contact Support",
        }}
      />
    );
  }

  if (userRole?.role === "student") {
    if (userRole.status === "Pending") {
      return (
        <Status
          icon={Clock}
          iconBg="bg-amber-500"
          iconColor="text-white"
          title="Account Under Review"
          description="Your student account is currently being reviewed by our team. You'll receive a notification once the review is complete."
        />
      );
    }

    if (userRole.status === "Rejected") {
      return (
        <Status
          icon={XCircle}
          iconColor="text-white"
          iconBg="bg-destructive"
          title="Account Application Rejected"
          description="Unfortunately, your student account application has been rejected. Please contact support for more information or to reapply."
          button={{
            icon: Mail,
            href: "/#contact",
            label: "Contact Support",
          }}
        />
      );
    }
  }

  return children;
};

export default DashboardLayoutContent;
