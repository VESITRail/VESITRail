"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isFailure } from "@/lib/result";
import Status from "@/components/ui/status";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { checkUserRole } from "@/actions/check-role";

const DashboardLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const session = authClient.useSession();
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

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
          router.push("/");
          return;
        }

        const { role, status } = result.data;

        if (role === "admin") {
          router.push("/dashboard/admin");
        } else if (role === "student") {
          if (status === "NeedsOnboarding") {
            router.push("/onboarding");
          } else {
            router.push("/dashboard/student");
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

  return children;
};

export default DashboardLayoutContent;
