"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isFailure } from "@/lib/result";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Status from "@/components/ui/status";
import { authClient } from "@/lib/auth-client";
import { checkUserRole } from "@/actions/check-role";

const OnboardingLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const session = authClient.useSession();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (session.data?.user) {
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
            return;
          }

          if (role === "student") {
            if (status === "NeedsOnboarding") {
              setIsVerifying(false);
              return;
            }

            router.push("/dashboard/student");
            return;
          }

          toast.error("Account status not recognized. Please contact support.");
          router.push("/");
          return;
        } catch (error) {
          console.error("Failed to verify access:", error);
          toast.error(
            "An error occurred while verifying your account. Please try again."
          );
          router.push("/");
        }
      }
    };

    if (!session.isPending && session.data?.user) {
      verifyAccess();
    }
  }, [router, session]);

  if (isVerifying) {
    return (
      <Status
        icon={Loader2}
        iconBg="bg-muted"
        title="Almost There!"
        iconColor="text-foreground"
        iconClassName="animate-spin"
        description="Please wait while we verify your account..."
      />
    );
  }

  return children;
};

export default OnboardingLayoutContent;
