import { Loader2 } from "lucide-react";
import Status from "@/components/ui/status";

const Dashboard = () => {
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
};

export default Dashboard;
