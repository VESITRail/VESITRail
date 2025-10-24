import { Metadata } from "next";
import StudentDashboardLayoutContent from "@/components/layout-content/student-dashboard-layout-content";

export const metadata: Metadata = {
	title: "Student Dashboard | VESITRail"
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	return <StudentDashboardLayoutContent>{children}</StudentDashboardLayoutContent>;
};

export default DashboardLayout;
