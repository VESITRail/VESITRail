import { Metadata } from "next";
import { Loader2 } from "lucide-react";
import Status from "@/components/ui/status";

export const metadata: Metadata = {
  title: "Dashboard | VESITRail",
};

const Dashboard = () => {
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

export default Dashboard;
