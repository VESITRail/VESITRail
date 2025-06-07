"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Status } from "@/components/ui/status";
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
          const { role, needsOnboarding } = await checkUserRole(
            session.data.user.id
          );

          if (role === "admin") {
            router.push("/dashboard/admin");
            return;
          }

          if (role === "student" && !needsOnboarding) {
            router.push("/dashboard/student");
            return;
          }

          setIsVerifying(false);
        } catch (error) {
          console.error("Failed to verify access:", error);
          router.push("/");
        }
      }
    };

    if (!session.isPending && session.data?.user) {
      verifyAccess();
    }
  }, [session, router]);

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
