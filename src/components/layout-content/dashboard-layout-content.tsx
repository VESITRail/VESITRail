"use client";

import {
  Home,
  Mail,
  Clock,
  Loader2,
  XCircle,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Status } from "@/components/ui/status";
import { checkUserRole } from "@/actions/check-role";
import { useRouter, usePathname } from "next/navigation";

const DashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const session = authClient.useSession();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<
    | false
    | "admin-deleted"
    | "admin-inactive"
    | "student-deleted"
    | "student-pending"
    | "student-rejected"
    | "verification-failed"
    | "unauthorized"
  >(false);

  useEffect(() => {
    const checkRole = async () => {
      if (session.data?.user) {
        try {
          const {
            status,
            role = "student",
            needsOnboarding,
          } = await checkUserRole(session.data.user.id);

          const isAdminPath = pathname?.startsWith("/dashboard/admin");
          const isStudentPath = pathname?.startsWith("/dashboard/student");

          if (needsOnboarding) {
            router.push("/onboarding");
            return;
          }

          if (
            (role === "admin" && isStudentPath) ||
            (role === "student" && isAdminPath)
          ) {
            setError("unauthorized");
            setIsVerifying(false);
            return;
          }

          if (role === "admin") {
            if (status === "deleted") {
              setError("admin-deleted");
              setIsVerifying(false);
              return;
            }
            if (status === "inactive") {
              setError("admin-inactive");
              setIsVerifying(false);
              return;
            }
            if (!isAdminPath) {
              router.push("/dashboard/admin");
              return;
            }
          } else {
            if (status === "deleted") {
              setError("student-deleted");
              setIsVerifying(false);
              return;
            }
            if (status === "pending") {
              setError("student-pending");
              setIsVerifying(false);
              return;
            }
            if (status === "rejected") {
              setError("student-rejected");
              setIsVerifying(false);
              return;
            }
            if (!isStudentPath) {
              router.push("/dashboard/student");
              return;
            }
          }

          setIsVerifying(false);
        } catch (error) {
          console.error("Failed to check user role:", error);
          setError("verification-failed");
          setIsVerifying(false);
        }
      }
    };

    if (!session.isPending && session.data?.user) {
      checkRole();
    }
  }, [session, router, pathname]);

  if (error === "admin-deleted") {
    return (
      <Status
        icon={AlertCircle}
        iconColor="text-white"
        title="Account Deleted"
        iconBg="bg-destructive"
        description="Your admin account has been deleted. Please contact the system administrator for assistance."
        button={{
          icon: Mail,
          label: "Contact",
          href: "/#contact",
          variant: "default",
        }}
      />
    );
  }

  if (error === "admin-inactive") {
    return (
      <Status
        icon={AlertCircle}
        iconColor="text-white"
        iconBg="bg-destructive"
        title="Account Inactive"
        description="Your admin account is currently inactive. Please contact the system administrator to reactivate your account."
        button={{
          icon: Mail,
          label: "Contact",
          href: "/#contact",
          variant: "default",
        }}
      />
    );
  }

  if (error === "student-deleted") {
    return (
      <Status
        icon={AlertCircle}
        iconColor="text-white"
        title="Account Deleted"
        iconBg="bg-destructive"
        description="Your student account has been deleted. Please contact the administrator for assistance."
        button={{
          icon: Mail,
          label: "Contact",
          href: "/#contact",
          variant: "default",
        }}
      />
    );
  }

  if (error === "student-pending") {
    return (
      <Status
        icon={Clock}
        iconBg="bg-yellow-600"
        iconColor="text-white"
        title="Account Pending Approval"
        description="Your account is pending approval from the administrator. You will be notified once it is approved."
        button={{
          href: "/",
          icon: Home,
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
        iconColor="text-white"
        title="Account Rejected"
        iconBg="bg-destructive"
        description="Your account registration has been rejected. Please contact the administrator for more information."
        button={{
          icon: Mail,
          label: "Contact",
          href: "/#contact",
          variant: "default",
        }}
      />
    );
  }

  if (error === "verification-failed") {
    return (
      <Status
        icon={AlertCircle}
        iconColor="text-white"
        iconBg="bg-destructive"
        title="Verification Failed"
        description="We couldn't verify your role. Please try again or contact support if the problem persists."
        button={{
          href: "/",
          icon: Home,
          variant: "default",
          label: "Go to Home",
        }}
      />
    );
  }

  if (error === "unauthorized") {
    return (
      <Status
        icon={AlertCircle}
        iconColor="text-white"
        iconBg="bg-destructive"
        title="Unauthorized Access"
        description="You do not have permission to access this area."
        button={{
          href: "/dashboard",
          variant: "default",
          icon: LayoutDashboard,
          label: "Go to Dashboard",
        }}
      />
    );
  }

  if (!isVerifying && !error) {
    return children;
  }

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
};

export default DashboardLayoutContent;
