import { Metadata } from "next";
import DashboardLayoutContent from "@/components/layout-content/dashboard-layout-content";

export const metadata: Metadata = {
	title: "Dashboard | VESITRail"
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
};

export default DashboardLayout;
