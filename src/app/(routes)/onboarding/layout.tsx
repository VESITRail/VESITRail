"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isFailure } from "@/lib/result";
import { useRouter } from "next/navigation";
import Status from "@/components/ui/status";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState, useRef } from "react";
import { checkAllUserRoles } from "@/actions/check-role";

const OnboardingLayoutContent = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const session = authClient.useSession();
	const hasCheckedRef = useRef<boolean>(false);
	const [isVerifying, setIsVerifying] = useState<boolean>(true);

	useEffect(() => {
		const verifyOnboardingAccess = async () => {
			if (hasCheckedRef.current || !session.data?.user) return;

			hasCheckedRef.current = true;

			try {
				const result = await checkAllUserRoles(session.data.user.id);

				if (isFailure(result)) {
					console.error("Failed to check user roles:", result.error);
					toast.error("Access Denied", {
						description: "Unable to verify your access. Redirecting you now."
					});
					router.push("/");
					return;
				}

				const roles = result.data;

				const needsOnboarding =
					roles.student && (roles.student.status === "NeedsOnboarding" || roles.student.status === "Rejected");

				if (needsOnboarding) {
					setIsVerifying(false);
					return;
				}

				if (roles.student?.status === "Approved") {
					router.push("/dashboard/student");
				} else if (roles.admin?.status === "Active") {
					router.push("/dashboard/admin");
				} else {
					router.push("/");
				}
			} catch (error) {
				console.error("Failed to verify onboarding access:", error);
				toast.error("Something Went Wrong", {
					description: "An unexpected error occurred. Redirecting you now."
				});
				router.push("/");
			}
		};

		if (!session.isPending && session.data?.user) {
			verifyOnboardingAccess();
		}
	}, [router, session.isPending, session.data?.user]);

	useEffect(() => {
		hasCheckedRef.current = false;
	}, [session.data?.user?.id]);

	if (isVerifying) {
		return (
			<Status
				icon={Loader2}
				iconBg="bg-primary"
				title="Almost There!"
				iconColor="text-white"
				iconClassName="animate-spin"
				description="Please wait while we verify your account..."
			/>
		);
	}

	return children;
};

export default OnboardingLayoutContent;
