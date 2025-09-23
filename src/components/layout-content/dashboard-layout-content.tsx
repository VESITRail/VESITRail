"use client";

import {
  UserRole,
  UserRoles,
  checkUserRole,
  checkAllUserRoles,
} from "@/actions/check-role";
import { toast } from "sonner";
import { isFailure } from "@/lib/result";
import { useFcm } from "@/hooks/use-fcm";
import Status from "@/components/ui/status";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import RoleSelection from "@/components/layout/role-selection";
import { Loader2, UserX, Clock, XCircle, Mail, RefreshCw } from "lucide-react";

const DashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const session = authClient.useSession();
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [allUserRoles, setAllUserRoles] = useState<UserRoles | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState<boolean>(false);

  useFcm(session.data?.user?.id);

  useEffect(() => {
    const isAdminPath = pathname.startsWith("/dashboard/admin");
    const isStudentPath = pathname.startsWith("/dashboard/student");
    const isOnboardingPath = pathname === "/onboarding";

    const checkAndRedirect = async () => {
      if (session.isPending) return;

      if (!session.data?.user) {
        setIsVerifying(false);
        return;
      }

      const allRolesResult = await checkAllUserRoles(session.data.user.id);

      if (isFailure(allRolesResult)) {
        toast.error("Access Verification Failed", {
          description:
            "Unable to verify your account access. Please try again.",
        });
        console.error("Failed to check user roles:", allRolesResult.error);
        setIsVerifying(false);
        return;
      }

      const roles = allRolesResult.data;
      setAllUserRoles(roles);

      const hasMultipleRoles = Boolean(roles.admin && roles.student);

      if (
        hasMultipleRoles &&
        !isAdminPath &&
        !isStudentPath &&
        !isOnboardingPath
      ) {
        setShowRoleSelection(true);
        setIsVerifying(false);
        return;
      } else {
        setShowRoleSelection(false);
      }

      const result = await checkUserRole(session.data.user.id);

      if (isFailure(result)) {
        toast.error("Access Verification Failed", {
          description:
            "Unable to verify your account access. Please try again.",
        });
        console.error("Failed to check user role:", result.error);
        setIsVerifying(false);
        return;
      }

      const { role, status, rejectionReason, submissionCount } = result.data;

      let effectiveRole = role;
      let effectiveStatus = status;
      let effectiveRejectionReason = rejectionReason;
      let effectiveSubmissionCount = submissionCount;

      if (hasMultipleRoles) {
        if (isAdminPath && roles.admin) {
          effectiveRole = "admin";
          effectiveStatus = roles.admin.status;
          effectiveRejectionReason = undefined;
          effectiveSubmissionCount = undefined;
        } else if ((isStudentPath || isOnboardingPath) && roles.student) {
          effectiveRole = "student";
          effectiveStatus = roles.student.status;
          effectiveRejectionReason = roles.student.rejectionReason;
          effectiveSubmissionCount = roles.student.submissionCount;
        }
      }

      setUserRole({
        role: effectiveRole,
        status: effectiveStatus,
        rejectionReason: effectiveRejectionReason,
        submissionCount: effectiveSubmissionCount,
      });

      if (isAdminPath) {
        if (!roles.admin || roles.admin.status !== "Active") {
          if (roles.student?.status === "Approved") {
            router.replace("/dashboard/student");
            return;
          } else if (roles.student?.status === "NeedsOnboarding") {
            router.replace("/onboarding");
            return;
          }
        }
      } else if (isStudentPath) {
        if (
          !roles.student ||
          !["Approved", "NeedsOnboarding"].includes(roles.student.status)
        ) {
          if (roles.admin?.status === "Active") {
            router.replace("/dashboard/admin");
            return;
          }
        } else if (roles.student.status === "NeedsOnboarding") {
          router.replace("/onboarding");
          return;
        }
      } else if (isOnboardingPath) {
        if (
          !roles.student ||
          !["NeedsOnboarding", "Rejected"].includes(roles.student.status)
        ) {
          if (roles.student?.status === "Approved") {
            router.replace("/dashboard/student");
            return;
          } else if (roles.admin?.status === "Active") {
            router.replace("/dashboard/admin");
            return;
          }
        }
      } else {
        if (roles.admin?.status === "Active") {
          router.replace("/dashboard/admin");
          return;
        } else if (roles.student?.status === "Approved") {
          router.replace("/dashboard/student");
          return;
        } else if (roles.student?.status === "NeedsOnboarding") {
          router.replace("/onboarding");
          return;
        }
      }

      setIsVerifying(false);
    };

    checkAndRedirect();
  }, [pathname, session.isPending, session.data?.user, router]);

  if (session.isPending || isVerifying) {
    return (
      <Status
        icon={Loader2}
        iconBg="bg-primary"
        iconColor="text-white"
        iconClassName="animate-spin"
        title="Setting Up Your Dashboard"
        description="Please wait while we verify your account..."
      />
    );
  }

  if (showRoleSelection && allUserRoles) {
    return (
      <RoleSelection
        roles={allUserRoles}
        userName={session.data?.user?.name || undefined}
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
      const rejectionMessage = userRole.rejectionReason
        ? `Rejection Reason: ${userRole.rejectionReason}.`
        : "Your student account application has been rejected.";

      const submissionText =
        userRole.submissionCount && userRole.submissionCount > 1
          ? ` This is your ${userRole.submissionCount}${
              userRole.submissionCount === 2
                ? "nd"
                : userRole.submissionCount === 3
                ? "rd"
                : "th"
            } submission.`
          : "";

      const description = userRole.rejectionReason
        ? `${rejectionMessage}${submissionText} Please review the feedback and update your application accordingly.`
        : `${rejectionMessage}${submissionText} You can update your information and resubmit your application.`;

      return (
        <Status
          icon={XCircle}
          iconColor="text-white"
          iconBg="bg-destructive"
          description={description}
          title="Application Rejected"
          button={{
            icon: RefreshCw,
            href: "/onboarding",
            label: "Update & Resubmit",
          }}
        />
      );
    }
  }

  return children;
};

export default DashboardLayoutContent;
